import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import type { Channel, PlaybackDiagnostics, PlaybackState } from '../types';
import { isHlsSupported, canPlayNativeHls, formatPlaybackError } from '../services/playbackService';

interface UsePlayerOptions {
  channel: Channel | null;
  initialVolume?: number;
  initialMuted?: boolean;
  connectionTimeoutSeconds?: number;
  onVolumeChange?: (volume: number, isMuted: boolean) => void;
}

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
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadStartTimeRef = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);
  const removeListenersRef = useRef<(() => void) | null>(null);

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
  });

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: channel ? 'connecting' : 'untested',
    error: null,
    volume: initialVolume,
    isMuted: initialMuted,
    isFullscreen: false,
    isLive: true,
    currentTime: 0,
    duration: 0,
    timeToFirstFrameMs: null,
    everSucceededInSession: false,
  });

  // Clean up any existing HLS instance, watchdog timers, listeners, and pending retries
  const cleanupHls = useCallback(() => {
    if (watchdogTimeoutRef.current) {
      clearTimeout(watchdogTimeoutRef.current);
      watchdogTimeoutRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
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
          console.warn('Play prevented:', err);
          diagnosticsRef.current.autoplayBlocked = true;
          setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
        });
      }
    } else {
      video.pause();
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
   * Only marks playback as confirmed after the media element reaches ready state
   * and actually advances media playback time or renders media frames.
   */
  const verifyActualPlayback = useCallback(() => {
    if (isCancelledRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    // Strict verification: media has advanced or loaded enough frames
    const hasAdvancedTime = video.currentTime > 0;
    const hasRenderedFrame = video.readyState >= 2 && (video.videoWidth > 0 || video.duration > 0);

    if (hasAdvancedTime || hasRenderedFrame) {
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }

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
        }));
      } else {
        setPlaybackState((prev) => ({
          ...prev,
          status: 'playing',
          error: null,
        }));
      }
    }
  }, []);

  const attachVideoListeners = useCallback(
    (video: HTMLVideoElement) => {
      if (removeListenersRef.current) {
        removeListenersRef.current();
        removeListenersRef.current = null;
      }

      const onPlay = () => {
        verifyActualPlayback();
      };

      const onPause = () => {
        setPlaybackState((prev) => (prev.status === 'playing' ? { ...prev, status: 'paused' } : prev));
      };

      const onWaiting = () => {
        setPlaybackState((prev) => (prev.status === 'playing' ? { ...prev, status: 'buffering' } : prev));
      };

      const onLoadedData = () => {
        verifyActualPlayback();
      };

      const onPlaying = () => {
        verifyActualPlayback();
      };

      const onTimeUpdate = () => {
        if (video.currentTime > 0) {
          verifyActualPlayback();
        }
        setPlaybackState((prev) => ({
          ...prev,
          currentTime: video.currentTime,
          duration: isNaN(video.duration) ? 0 : video.duration,
        }));
      };

      const onError = () => {
        if (hlsRef.current) return;
        const mediaError = video.error;
        let details = 'Unknown video error';
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
        setPlaybackState((prev) => ({
          ...prev,
          status: 'error',
          error: formatPlaybackError('mediaElementError', details),
        }));
      };

      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('waiting', onWaiting);
      video.addEventListener('playing', onPlaying);
      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('error', onError);

      removeListenersRef.current = () => {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('error', onError);
      };
    },
    [verifyActualPlayback]
  );

  // Load and play the channel stream
  const loadStream = useCallback(() => {
    isCancelledRef.current = false;
    const video = videoRef.current;
    if (!video || !channel) {
      setPlaybackState((prev) => ({ ...prev, status: 'untested', error: null }));
      return;
    }

    cleanupHls();
    attachVideoListeners(video);

    loadStartTimeRef.current = Date.now();
    diagnosticsRef.current.connectingStartedAt = loadStartTimeRef.current;
    diagnosticsRef.current.hlsFatalError = undefined;
    diagnosticsRef.current.networkErrorCode = undefined;
    diagnosticsRef.current.unsupportedCodec = false;
    diagnosticsRef.current.autoplayBlocked = false;
    diagnosticsRef.current.isCorsError = false;
    diagnosticsRef.current.isAuthRestricted = false;

    setPlaybackState((prev) => ({
      ...prev,
      status: 'connecting',
      error: null,
      currentTime: 0,
      duration: 0,
      timeToFirstFrameMs: null,
    }));

    video.volume = initialVolume;
    video.muted = initialMuted;

    const streamUrl = getEffectiveStreamUrl(channel.url);
    const timeoutMs = Math.max(6000, Math.min(30000, connectionTimeoutSeconds * 1000));

    // Watchdog timer: Configurable to prevent false timeouts on slower international CDNs
    watchdogTimeoutRef.current = setTimeout(() => {
      setPlaybackState((prev) => {
        if (prev.status === 'connecting' || prev.status === 'buffering' || prev.status === 'loading') {
          cleanupHls();
          const errorInfo = formatPlaybackError(
            'timeout',
            `Connection timed out after ${connectionTimeoutSeconds}s waiting for media frames.`
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
        enableWorker: true,
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
        hls.loadSource(streamUrl);
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        // Active data packets received: stream is making progress
        setPlaybackState((prev) => (prev.status === 'connecting' ? { ...prev, status: 'buffering' } : prev));
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const isLive = data.levels.some((lvl) => lvl.details?.live ?? true);
        setPlaybackState((prev) => ({ ...prev, isLive }));

        // Attempt playback with audio
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Wait for actual readyState and media time advancement in event listeners
              verifyActualPlayback();
            })
            .catch((err) => {
              if (err.name === 'NotAllowedError') {
                diagnosticsRef.current.autoplayBlocked = true;
                video.muted = true;
                setPlaybackState((prev) => ({ ...prev, isMuted: true }));
                const mutedPromise = video.play();
                if (mutedPromise !== undefined) {
                  mutedPromise
                    .then(() => {
                      verifyActualPlayback();
                    })
                    .catch(() => {
                      setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
                    });
                }
              } else {
                console.warn('Playback error after manifest parsed:', err);
              }
            });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        const httpStatus = data.response?.code;
        const isExplicitFatalCode = httpStatus === 403 || httpStatus === 404 || httpStatus === 401;

        if (httpStatus) {
          diagnosticsRef.current.networkErrorCode = httpStatus;
          if (httpStatus === 403) diagnosticsRef.current.isAuthRestricted = true;
          if (httpStatus === 0) diagnosticsRef.current.isCorsError = true;
        }

        if (isExplicitFatalCode || data.fatal) {
          diagnosticsRef.current.hlsFatalError = data.details;

          // Clear watchdog on confirmed error
          if (watchdogTimeoutRef.current) {
            clearTimeout(watchdogTimeoutRef.current);
            watchdogTimeoutRef.current = null;
          }

          if (isExplicitFatalCode || retryCountRef.current >= 1) {
            const errorInfo = formatPlaybackError(
              data.type === Hls.ErrorTypes.MEDIA_ERROR ? 'mediaError' : 'networkError',
              data.details,
              httpStatus
            );
            cleanupHls();
            setPlaybackState((prev) => ({
              ...prev,
              status: 'error',
              error: errorInfo,
            }));
          } else {
            retryCountRef.current += 1;
            retryTimeoutRef.current = setTimeout(() => {
              if (hlsRef.current) {
                if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                  hlsRef.current.recoverMediaError();
                } else {
                  hlsRef.current.startLoad();
                }
              }
            }, 800);
          }
        }
      });
    } else if (canPlayNativeHls(video)) {
      // Native Apple Safari HLS
      video.src = streamUrl;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            verifyActualPlayback();
          })
          .catch((err) => {
            if (err.name === 'NotAllowedError') {
              diagnosticsRef.current.autoplayBlocked = true;
              video.muted = true;
              setPlaybackState((prev) => ({ ...prev, isMuted: true }));
              video
                .play()
                .then(() => {
                  verifyActualPlayback();
                })
                .catch(() => {
                  setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
                });
            }
          });
      }
    } else {
      // Media Source Extensions unsupported
      diagnosticsRef.current.unsupportedCodec = true;
      setPlaybackState((prev) => ({
        ...prev,
        status: 'error',
        error: {
          message: 'Your browser does not support HLS streaming video.',
          details: 'Media Source Extensions (MSE) unsupported',
          unsupportedCodec: true,
          canRetry: false,
        },
      }));
    }
  }, [channel, cleanupHls, initialVolume, initialMuted, connectionTimeoutSeconds, verifyActualPlayback, attachVideoListeners]);

  // Video element event listeners effect for cases where videoRef mounts or unmounts
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      attachVideoListeners(video);
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
    retryCountRef.current = 0;
    loadStream();

    return () => {
      isCancelledRef.current = true;
      cleanupHls();
    };
  }, [channel, loadStream, cleanupHls]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
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
