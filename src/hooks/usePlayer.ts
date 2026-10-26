import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import type { Channel, PlaybackDiagnostics, PlaybackState, PlaybackStatus } from '../types';
import { isHlsSupported, canPlayNativeHls, formatPlaybackError } from '../services/playbackService';

interface UsePlayerOptions {
  channel: Channel | null;
  initialVolume?: number;
  initialMuted?: boolean;
  connectionTimeoutSeconds?: number;
  onVolumeChange?: (volume: number, isMuted: boolean) => void;
}

const MAX_RECOVERIES = 1;

export function usePlayer({
  channel,
  initialVolume = 0.8,
  initialMuted = false,
  connectionTimeoutSeconds = 12,
  onVolumeChange,
}: UsePlayerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const recoveryCountRef = useRef<number>(0);
  const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadStartTimeRef = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);
  const removeListenersRef = useRef<(() => void) | null>(null);
  const channelLoadIdRef = useRef<number>(0);
  const playbackStatusRef = useRef<PlaybackStatus>(channel ? 'loading' : 'idle');

  const diagnosticsRef = useRef<PlaybackDiagnostics>({
    timeToFirstFrameMs: null,
    connectingStartedAt: null,
    everSucceededInSession: false,
    hlsFatalError: undefined,
    networkErrorCode: undefined,
    unsupportedCodec: false,
    autoplayBlocked: false,
    isCorsError: false,
    isAuthRestricted: false,
    recoveryAttempts: 0,
    channelLoadId: 0,
    diagnosedCause: undefined,
    observedResolution: null,
  });

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: channel ? 'loading' : 'idle',
    error: null,
    volume: initialVolume,
    isMuted: initialMuted,
    isFullscreen: false,
    isLive: true,
    currentTime: 0,
    duration: 0,
    timeToFirstFrameMs: null,
    everSucceededInSession: false,
    observedResolution: null,
  });

  // Clean up existing HLS instance, all bounded timers, listeners, and pending retries
  const cleanupHls = useCallback(() => {
    if (startupTimeoutRef.current) {
      clearTimeout(startupTimeoutRef.current);
      startupTimeoutRef.current = null;
    }

    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
      recoveryTimeoutRef.current = null;
    }

    if (removeListenersRef.current) {
      removeListenersRef.current();
      removeListenersRef.current = null;
    }

    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch (err) {
        console.warn('Error during HLS cleanup:', err);
      }
      hlsRef.current = null;
    }
  }, []);

  // Update volume
  const setVolume = useCallback(
    (newVolume: number) => {
      const clamped = Math.max(0, Math.min(1, newVolume));
      if (videoRef.current) {
        videoRef.current.volume = clamped;
        videoRef.current.muted = clamped === 0;
      }
      setPlaybackState((prev) => ({
        ...prev,
        volume: clamped,
        isMuted: clamped === 0 ? true : prev.isMuted,
      }));
      onVolumeChange?.(clamped, clamped === 0 ? true : playbackState.isMuted);
    },
    [playbackState.isMuted, onVolumeChange]
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setPlaybackState((prev) => ({
      ...prev,
      isMuted: nextMuted,
    }));
    onVolumeChange?.(playbackState.volume, nextMuted);
  }, [playbackState.volume, onVolumeChange]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Play prevented by browser:', err);
          diagnosticsRef.current.autoplayBlocked = true;
          setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
        });
      }
    } else {
      video.pause();
      setPlaybackState((prev) => (prev.status === 'playing' ? { ...prev, status: 'paused' } : prev));
    }
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current || videoRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  // Resolves effective stream URL with HTTPS upgrade if on HTTPS page
  const getEffectiveStreamUrl = (rawUrl: string): string => {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      if (rawUrl.startsWith('http://')) {
        return rawUrl.replace('http://', 'https://');
      }
    }
    return rawUrl;
  };

  /**
   * Enters 'playing' state ONLY after actual playback evidence:
   * 1. currentTime advances > 0, OR
   * 2. decoded video frames increase (webkitDecodedFrameCount > 0 or readyState >= 2 with videoWidth > 0).
   * Does NOT enter playing merely on manifest parse or a playing event alone.
   */
  const verifyActualPlayback = useCallback((expectedLoadId?: number) => {
    if (isCancelledRef.current) return;
    if (expectedLoadId !== undefined && expectedLoadId !== channelLoadIdRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    const hasAdvancedTime = video.currentTime > 0;
    const hasDecodedFrames =
      ((video as any).webkitDecodedFrameCount !== undefined &&
        (video as any).webkitDecodedFrameCount > 0) ||
      (video.readyState >= 2 && video.videoWidth > 0);

    if (hasAdvancedTime || hasDecodedFrames) {
      // Clear startup watchdog on confirmed playback
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
        recoveryTimeoutRef.current = null;
      }
      recoveryCountRef.current = 0;

      // Detect real observed resolution
      let observedRes: string | null = null;
      if (video.videoHeight > 0) {
        if (video.videoHeight >= 1080) observedRes = '1080p';
        else if (video.videoHeight >= 720) observedRes = '720p';
        else if (video.videoHeight >= 480) observedRes = '480p';
        else observedRes = `${video.videoHeight}p`;
      }
      diagnosticsRef.current.observedResolution = observedRes;
      playbackStatusRef.current = 'playing';

      if (!diagnosticsRef.current.everSucceededInSession) {
        const ttf = loadStartTimeRef.current > 0 ? Date.now() - loadStartTimeRef.current : null;
        diagnosticsRef.current.timeToFirstFrameMs = ttf;
        diagnosticsRef.current.everSucceededInSession = true;

        setPlaybackState((prev) => ({
          ...prev,
          status: 'playing',
          error: null,
          timeToFirstFrameMs: ttf,
          everSucceededInSession: true,
          observedResolution: observedRes,
        }));
      } else {
        setPlaybackState((prev) => ({
          ...prev,
          status: 'playing',
          error: null,
          observedResolution: observedRes,
        }));
      }
    }
  }, []);

  const attachVideoListeners = useCallback(
    (video: HTMLVideoElement, loadId: number) => {
      if (removeListenersRef.current) {
        removeListenersRef.current();
        removeListenersRef.current = null;
      }

      const onPlay = () => {
        if (loadId !== channelLoadIdRef.current) return;
        verifyActualPlayback(loadId);
      };

      const onPause = () => {
        if (loadId !== channelLoadIdRef.current) return;
        playbackStatusRef.current = 'paused';
        setPlaybackState((prev) => (prev.status === 'playing' ? { ...prev, status: 'paused' } : prev));
      };

      const onWaiting = () => {
        if (loadId !== channelLoadIdRef.current) return;
        // If media stalls while playing, transition to recovering with bounded recovery timeout
        if (playbackStatusRef.current === 'playing' && recoveryCountRef.current < MAX_RECOVERIES) {
          recoveryCountRef.current += 1;
          diagnosticsRef.current.recoveryAttempts = recoveryCountRef.current;
          playbackStatusRef.current = 'recovering';
          setPlaybackState((prev) => ({ ...prev, status: 'recovering' }));

          recoveryTimeoutRef.current = setTimeout(() => {
            if (loadId !== channelLoadIdRef.current) return;
            if (hlsRef.current) {
              hlsRef.current.recoverMediaError();
            }
          }, 1500);
        }
      };

      const onLoadedData = () => {
        if (loadId !== channelLoadIdRef.current) return;
        verifyActualPlayback(loadId);
      };

      const onTimeUpdate = () => {
        if (loadId !== channelLoadIdRef.current) return;
        if (video.currentTime > 0) {
          verifyActualPlayback(loadId);
        }
        setPlaybackState((prev) => ({
          ...prev,
          currentTime: video.currentTime,
          duration: isNaN(video.duration) ? 0 : video.duration,
        }));
      };

      const onError = () => {
        if (loadId !== channelLoadIdRef.current) return;
        if (hlsRef.current) return; // Hls error handler manages HLS errors
        const mediaError = video.error;
        let details = 'Unknown video element error';
        if (mediaError) {
          switch (mediaError.code) {
            case 1:
              details = 'MEDIA_ERR_ABORTED';
              break;
            case 2:
              details = 'MEDIA_ERR_NETWORK';
              break;
            case 3:
              details = 'MEDIA_ERR_DECODE';
              diagnosticsRef.current.unsupportedCodec = true;
              break;
            case 4:
              details = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
              diagnosticsRef.current.unsupportedCodec = true;
              break;
          }
        }
        cleanupHls();
        const errorInfo = formatPlaybackError('mediaElementError', details, undefined, channel);
        setPlaybackState((prev) => ({
          ...prev,
          status: 'error',
          error: errorInfo,
        }));
      };

      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('waiting', onWaiting);
      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('error', onError);

      removeListenersRef.current = () => {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('error', onError);
      };
    },
    [channel, cleanupHls, verifyActualPlayback]
  );

  // Load and play the channel stream
  const loadStream = useCallback(() => {
    isCancelledRef.current = false;
    const currentLoadId = ++channelLoadIdRef.current;
    diagnosticsRef.current.channelLoadId = currentLoadId;

    const video = videoRef.current;
    if (!video || !channel) {
      cleanupHls();
      setPlaybackState((prev) => ({ ...prev, status: 'idle', error: null }));
      return;
    }

    cleanupHls();
    attachVideoListeners(video, currentLoadId);

    loadStartTimeRef.current = Date.now();
    recoveryCountRef.current = 0;
    diagnosticsRef.current.connectingStartedAt = loadStartTimeRef.current;
    diagnosticsRef.current.hlsFatalError = undefined;
    diagnosticsRef.current.networkErrorCode = undefined;
    diagnosticsRef.current.unsupportedCodec = false;
    diagnosticsRef.current.autoplayBlocked = false;
    diagnosticsRef.current.isCorsError = false;
    diagnosticsRef.current.isAuthRestricted = false;
    diagnosticsRef.current.recoveryAttempts = 0;
    diagnosticsRef.current.observedResolution = null;

    setPlaybackState((prev) => ({
      ...prev,
      status: 'loading',
      error: null,
      currentTime: 0,
      duration: 0,
      timeToFirstFrameMs: null,
      observedResolution: null,
    }));

    video.volume = initialVolume;
    video.muted = initialMuted;

    const streamUrl = getEffectiveStreamUrl(channel.url);
    const timeoutMs = Math.max(6000, Math.min(30000, connectionTimeoutSeconds * 1000));

    // Bounded startup watchdog timer
    startupTimeoutRef.current = setTimeout(() => {
      if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;

      setPlaybackState((prev) => {
        if (prev.status === 'loading' || prev.status === 'recovering') {
          cleanupHls();
          const errorInfo = formatPlaybackError(
            'timeout',
            `Connection timed out after ${connectionTimeoutSeconds}s waiting for playable media frames.`,
            undefined,
            channel
          );
          return {
            ...prev,
            status: 'error',
            error: errorInfo,
          };
        }
        return prev;
      });
    }, timeoutMs);

    // Check MSE support with HLS.js
    if (isHlsSupported()) {
      const hls = new Hls({
        enableWorker: false, // Disabling worker in browser avoids thread serialization delays on fast segments
        lowLatencyMode: false,
        backBufferLength: 60,
        maxBufferLength: 20,
        maxMaxBufferLength: 90,
        maxBufferSize: 50 * 1000 * 1000,
        fragLoadingTimeOut: 10000,
        manifestLoadingTimeOut: 8000,
        levelLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: 1,
        levelLoadingMaxRetry: 1,
        fragLoadingMaxRetry: 1,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;
        hls.loadSource(streamUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;
        const isLive = data.levels.some((lvl) => lvl.details?.live ?? true);
        setPlaybackState((prev) => ({ ...prev, isLive }));

        // Attempt playback with audio
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (currentLoadId !== channelLoadIdRef.current) return;
              // Verification waits for actual readyState and media time advancement
              verifyActualPlayback(currentLoadId);
            })
            .catch((err) => {
              if (currentLoadId !== channelLoadIdRef.current) return;
              if (err.name === 'NotAllowedError') {
                diagnosticsRef.current.autoplayBlocked = true;
                video.muted = true;
                setPlaybackState((prev) => ({ ...prev, isMuted: true }));
                const mutedPromise = video.play();
                if (mutedPromise !== undefined) {
                  mutedPromise
                    .then(() => {
                      if (currentLoadId !== channelLoadIdRef.current) return;
                      verifyActualPlayback(currentLoadId);
                    })
                    .catch(() => {
                      if (currentLoadId !== channelLoadIdRef.current) return;
                      setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
                    });
                }
              }
            });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;

        const httpStatus = data.response?.code;
        const isExplicitFatalCode =
          httpStatus === 403 || httpStatus === 401 || httpStatus === 404;

        if (httpStatus !== undefined) {
          diagnosticsRef.current.networkErrorCode = httpStatus;
          if (httpStatus === 403) diagnosticsRef.current.isAuthRestricted = true;
          if (httpStatus === 0) diagnosticsRef.current.isCorsError = true;
        }

        // Terminal fatal error: immediate transition to 'error', no infinite loop
        if (isExplicitFatalCode || (data.fatal && recoveryCountRef.current >= MAX_RECOVERIES)) {
          diagnosticsRef.current.hlsFatalError = data.details;
          cleanupHls();
          playbackStatusRef.current = 'error';

          const errorInfo = formatPlaybackError(
            data.type === Hls.ErrorTypes.MEDIA_ERROR ? 'mediaError' : 'networkError',
            data.details,
            httpStatus,
            channel
          );

          setPlaybackState((prev) => ({
            ...prev,
            status: 'error',
            error: errorInfo,
          }));
          return;
        }

        // Recoverable error: transition to 'recovering' with bounded recovery attempt
        if (data.fatal) {
          recoveryCountRef.current += 1;
          diagnosticsRef.current.recoveryAttempts = recoveryCountRef.current;
          playbackStatusRef.current = 'recovering';
          setPlaybackState((prev) => ({ ...prev, status: 'recovering' }));

          if (recoveryTimeoutRef.current) {
            clearTimeout(recoveryTimeoutRef.current);
          }

          // Bounded recovery timer
          recoveryTimeoutRef.current = setTimeout(() => {
            if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;

            if (hlsRef.current) {
              if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hlsRef.current.recoverMediaError();
              } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hlsRef.current.startLoad();
              } else {
                cleanupHls();
                playbackStatusRef.current = 'error';
                const errorInfo = formatPlaybackError(data.type, data.details, httpStatus, channel);
                setPlaybackState((prev) => ({
                  ...prev,
                  status: 'error',
                  error: errorInfo,
                }));
              }
            }
          }, 800);
        }
      });
    } else if (canPlayNativeHls(video)) {
      // Native Apple Safari HLS
      video.src = streamUrl;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (currentLoadId !== channelLoadIdRef.current) return;
            verifyActualPlayback(currentLoadId);
          })
          .catch((err) => {
            if (currentLoadId !== channelLoadIdRef.current) return;
            if (err.name === 'NotAllowedError') {
              diagnosticsRef.current.autoplayBlocked = true;
              video.muted = true;
              setPlaybackState((prev) => ({ ...prev, isMuted: true }));
              video
                .play()
                .then(() => {
                  if (currentLoadId !== channelLoadIdRef.current) return;
                  verifyActualPlayback(currentLoadId);
                })
                .catch(() => {
                  if (currentLoadId !== channelLoadIdRef.current) return;
                  setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
                });
            }
          });
      }
    } else {
      // Media Source Extensions unsupported
      diagnosticsRef.current.unsupportedCodec = true;
      cleanupHls();
      setPlaybackState((prev) => ({
        ...prev,
        status: 'error',
        error: {
          message: 'Your browser does not support HLS streaming video.',
          category: 'unsupportedCodec',
          details: 'Media Source Extensions (MSE) unsupported',
          unsupportedCodec: true,
          canRetry: false,
        },
      }));
    }
  }, [
    channel,
    cleanupHls,
    initialVolume,
    initialMuted,
    connectionTimeoutSeconds,
    verifyActualPlayback,
    attachVideoListeners,
  ]);

  // Video element event listeners effect for cases where videoRef mounts or unmounts
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      attachVideoListeners(video, channelLoadIdRef.current);
    }
    return () => {
      if (removeListenersRef.current) {
        removeListenersRef.current();
        removeListenersRef.current = null;
      }
    };
  }, [attachVideoListeners]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setPlaybackState((prev) => ({ ...prev, isFullscreen: isFs }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load stream when channel changes
  useEffect(() => {
    loadStream();

    return () => {
      isCancelledRef.current = true;
      cleanupHls();
    };
  }, [channel, loadStream, cleanupHls]);

  const retry = useCallback(() => {
    recoveryCountRef.current = 0;
    loadStream();
  }, [loadStream]);

  return {
    videoRef,
    containerRef,
    playbackState,
    diagnostics: diagnosticsRef.current,
    togglePlay,
    setVolume,
    toggleMute,
    toggleFullscreen,
    retry,
  };
}
