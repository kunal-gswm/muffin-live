import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import type { Channel, PlaybackDiagnostics, PlaybackError, PlaybackState, PlaybackStatus } from '../types';
import { isHlsSupported, canPlayNativeHls, formatPlaybackError } from '../services/playbackService';

interface UsePlayerOptions {
  channel: Channel | null;
  initialVolume?: number;
  initialMuted?: boolean;
  connectionTimeoutSeconds?: number;
  onVolumeChange?: (volume: number, isMuted: boolean) => void;
}

const MAX_RECOVERIES = 1;

/**
 * Timestamped development lifecycle logger.
 */
const isDev =
  Boolean(import.meta.env?.DEV) ||
  (typeof window !== 'undefined' && Boolean((window as any).__MUFFIN_DEBUG__));

const logLifecycle = (loadId: number, event: string, extra?: unknown) => {
  if (isDev) {
    const ts = new Date().toISOString().substring(11, 23);
    if (extra !== undefined) {
      console.debug(`[MuffinPlayer ${ts}][load#${loadId}] ${event}`, extra);
    } else {
      console.debug(`[MuffinPlayer ${ts}][load#${loadId}] ${event}`);
    }
  }
};

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

  // Store options in refs so re-renders or callback changes do not recreate loadStream or restart playback
  const channelRef = useRef<Channel | null>(channel);
  const initialVolumeRef = useRef<number>(initialVolume);
  const initialMutedRef = useRef<boolean>(initialMuted);
  const timeoutSecondsRef = useRef<number>(connectionTimeoutSeconds);
  const onVolumeChangeRef = useRef(onVolumeChange);

  channelRef.current = channel;
  initialVolumeRef.current = initialVolume;
  initialMutedRef.current = initialMuted;
  timeoutSecondsRef.current = connectionTimeoutSeconds;
  onVolumeChangeRef.current = onVolumeChange;

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
    stage: channel ? 'starting' : 'idle',
    abortErrorCount: 0,
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
  const cleanupHls = useCallback((reason: string = 'cleanup') => {
    logLifecycle(channelLoadIdRef.current, `cleanupHls called (${reason})`);
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
      onVolumeChangeRef.current?.(clamped, clamped === 0 ? true : playbackState.isMuted);
    },
    [playbackState.isMuted]
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
    onVolumeChangeRef.current?.(playbackState.volume, nextMuted);
  }, [playbackState.volume]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err?.name === 'AbortError') {
            diagnosticsRef.current.abortErrorCount = (diagnosticsRef.current.abortErrorCount || 0) + 1;
            return;
          }
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
      logLifecycle(
        channelLoadIdRef.current,
        `verifyActualPlayback: confirmed playback (time=${video.currentTime.toFixed(2)}s, readyState=${video.readyState}, ${video.videoWidth}x${video.videoHeight})`
      );

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
      diagnosticsRef.current.stage = 'playing';
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
        if (loadId !== channelLoadIdRef.current || isCancelledRef.current) return;
        verifyActualPlayback(loadId);
      };

      const onPause = () => {
        if (loadId !== channelLoadIdRef.current || isCancelledRef.current) return;
        playbackStatusRef.current = 'paused';
        setPlaybackState((prev) => (prev.status === 'playing' ? { ...prev, status: 'paused' } : prev));
      };

      const onWaiting = () => {
        if (loadId !== channelLoadIdRef.current || isCancelledRef.current) return;
        // If media stalls while playing, transition to recovering with bounded recovery timeout
        if (playbackStatusRef.current === 'playing' && recoveryCountRef.current < MAX_RECOVERIES) {
          recoveryCountRef.current += 1;
          diagnosticsRef.current.recoveryAttempts = recoveryCountRef.current;
          diagnosticsRef.current.stage = 'recovering';
          playbackStatusRef.current = 'recovering';
          setPlaybackState((prev) => ({ ...prev, status: 'recovering' }));

          recoveryTimeoutRef.current = setTimeout(() => {
            if (loadId !== channelLoadIdRef.current || isCancelledRef.current) return;
            if (hlsRef.current) {
              logLifecycle(loadId, 'Waiting stalled -> recovering media error');
              hlsRef.current.recoverMediaError();
            }
          }, 1500);
        }
      };

      const onLoadedData = () => {
        if (loadId !== channelLoadIdRef.current || isCancelledRef.current) return;
        verifyActualPlayback(loadId);
      };

      const onTimeUpdate = () => {
        if (loadId !== channelLoadIdRef.current || isCancelledRef.current) return;
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
        if (loadId !== channelLoadIdRef.current || isCancelledRef.current) return;
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
        logLifecycle(loadId, `Video element error: ${details}`);
        cleanupHls('media_element_error');
        diagnosticsRef.current.stage = 'error';
        const errorInfo = formatPlaybackError('mediaElementError', details, undefined, channelRef.current);
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
    [cleanupHls, verifyActualPlayback]
  );

  // Load and play the channel stream
  const loadStream = useCallback(() => {
    isCancelledRef.current = false;
    const currentLoadId = ++channelLoadIdRef.current;
    diagnosticsRef.current.channelLoadId = currentLoadId;
    diagnosticsRef.current.stage = 'starting';

    const currentChannel = channelRef.current;
    const video = videoRef.current;
    if (!video || !currentChannel) {
      logLifecycle(currentLoadId, 'loadStream: videoRef or channel is null; transitioning to idle');
      cleanupHls('no_video_or_channel');
      setPlaybackState((prev) => ({ ...prev, status: 'idle', error: null }));
      return;
    }

    logLifecycle(
      currentLoadId,
      `loadStream: starting for channel "${currentChannel.name}" (${currentChannel.url})`
    );
    cleanupHls('new_load_started');
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

    video.volume = initialVolumeRef.current;
    video.muted = initialMutedRef.current;

    const streamUrl = getEffectiveStreamUrl(currentChannel.url);
    const timeoutSeconds = timeoutSecondsRef.current;
    const timeoutMs = Math.max(6000, Math.min(30000, timeoutSeconds * 1000));

    // Bounded startup watchdog timer
    startupTimeoutRef.current = setTimeout(() => {
      if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) {
        logLifecycle(currentLoadId, 'Watchdog expired but was superseded by newer load or cancellation');
        return;
      }

      setPlaybackState((prev) => {
        if (prev.status === 'loading' || prev.status === 'recovering') {
          logLifecycle(
            currentLoadId,
            `Connection timed out after ${timeoutSeconds}s waiting for playable media frames.`
          );
          cleanupHls('startup_timeout');
          diagnosticsRef.current.stage = 'timeout';

          // If an underlying fatal HLS error was already encountered during recovery, preserve its diagnosis
          let errorInfo: PlaybackError;
          if (diagnosticsRef.current.hlsFatalError) {
            errorInfo = formatPlaybackError(
              'networkError',
              diagnosticsRef.current.hlsFatalError,
              diagnosticsRef.current.networkErrorCode,
              currentChannel
            );
          } else {
            errorInfo = formatPlaybackError(
              'timeout',
              `Connection timed out after ${timeoutSeconds}s waiting for playable media frames.`,
              undefined,
              currentChannel
            );
          }

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
      logLifecycle(currentLoadId, 'Creating HLS.js instance');
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
        logLifecycle(currentLoadId, `HLS MEDIA_ATTACHED -> loading source ${streamUrl}`);
        diagnosticsRef.current.stage = 'manifest_loading';
        hls.loadSource(streamUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;
        logLifecycle(
          currentLoadId,
          `HLS MANIFEST_PARSED (${data.levels?.length || 0} levels) -> invoking video.play()`
        );
        diagnosticsRef.current.stage = 'manifest_parsed';
        const isLive = data.levels.some((lvl) => lvl.details?.live ?? true);
        setPlaybackState((prev) => ({ ...prev, isLive }));

        // Attempt playback with audio
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;
              logLifecycle(currentLoadId, 'video.play() resolved; waiting for media frames');
              // Verification waits for actual readyState and media time advancement
              verifyActualPlayback(currentLoadId);
            })
            .catch((err) => {
              if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) {
                logLifecycle(
                  currentLoadId,
                  `Ignored play() rejection for stale/cancelled load: ${err?.name || err}`
                );
                return;
              }
              if (err?.name === 'AbortError') {
                diagnosticsRef.current.abortErrorCount =
                  (diagnosticsRef.current.abortErrorCount || 0) + 1;
                logLifecycle(
                  currentLoadId,
                  'play() interrupted by new load request (AbortError) - expected during transition'
                );
                return;
              }
              if (err?.name === 'NotAllowedError') {
                diagnosticsRef.current.autoplayBlocked = true;
                logLifecycle(currentLoadId, 'Autoplay blocked by browser policy; retrying muted');
                video.muted = true;
                setPlaybackState((prev) => ({ ...prev, isMuted: true }));
                const mutedPromise = video.play();
                if (mutedPromise !== undefined) {
                  mutedPromise
                    .then(() => {
                      if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;
                      logLifecycle(currentLoadId, 'Muted play() resolved; waiting for media frames');
                      verifyActualPlayback(currentLoadId);
                    })
                    .catch((mErr) => {
                      if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;
                      if (mErr?.name === 'AbortError') {
                        diagnosticsRef.current.abortErrorCount =
                          (diagnosticsRef.current.abortErrorCount || 0) + 1;
                        return;
                      }
                      logLifecycle(currentLoadId, `Muted play() also rejected: ${mErr?.name || mErr}`);
                      setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
                    });
                }
                return;
              }
              console.warn(
                `[MuffinPlayer][load#${currentLoadId}] Playback error after manifest parsed:`,
                err
              );
            });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) {
          logLifecycle(currentLoadId, `Ignored HLS error for stale/cancelled load: ${data.details}`);
          return;
        }

        const httpStatus = data.response?.code;
        const isExplicitFatalCode =
          httpStatus === 403 || httpStatus === 401 || httpStatus === 404;

        logLifecycle(
          currentLoadId,
          `HLS ERROR: type=${data.type}, details=${data.details}, fatal=${data.fatal}, status=${httpStatus}`
        );

        if (httpStatus !== undefined) {
          diagnosticsRef.current.networkErrorCode = httpStatus;
          if (httpStatus === 403) diagnosticsRef.current.isAuthRestricted = true;
          if (httpStatus === 0) diagnosticsRef.current.isCorsError = true;
        }

        // Terminal fatal error: immediate transition to 'error', no infinite loop
        if (isExplicitFatalCode || (data.fatal && recoveryCountRef.current >= MAX_RECOVERIES)) {
          diagnosticsRef.current.hlsFatalError = data.details;
          diagnosticsRef.current.stage = 'fatal_error';
          cleanupHls('fatal_hls_error');
          playbackStatusRef.current = 'error';

          const errorInfo = formatPlaybackError(
            data.type === Hls.ErrorTypes.MEDIA_ERROR ? 'mediaError' : 'networkError',
            data.details,
            httpStatus,
            currentChannel
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
          diagnosticsRef.current.hlsFatalError = data.details;
          recoveryCountRef.current += 1;
          diagnosticsRef.current.recoveryAttempts = recoveryCountRef.current;
          diagnosticsRef.current.stage = 'recovering';
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
                if (data.details === 'manifestParsingError') {
                  cleanupHls('fatal_manifest_parsing_error');
                  playbackStatusRef.current = 'error';
                  const errorInfo = formatPlaybackError(
                    data.type,
                    data.details,
                    httpStatus,
                    currentChannel
                  );
                  setPlaybackState((prev) => ({
                    ...prev,
                    status: 'error',
                    error: errorInfo,
                  }));
                  return;
                }
                logLifecycle(currentLoadId, 'Invoking hls.recoverMediaError()');
                hlsRef.current.recoverMediaError();
              } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                if (
                  data.details === 'manifestLoadError' ||
                  data.details === 'manifestLoadTimeOut'
                ) {
                  logLifecycle(currentLoadId, 'Invoking hls.loadSource() for manifest retry');
                  hlsRef.current.loadSource(streamUrl);
                } else {
                  logLifecycle(currentLoadId, 'Invoking hls.startLoad()');
                  hlsRef.current.startLoad();
                }
              } else {
                cleanupHls('unrecoverable_hls_error');
                playbackStatusRef.current = 'error';
                const errorInfo = formatPlaybackError(
                  data.type,
                  data.details,
                  httpStatus,
                  currentChannel
                );
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
      logLifecycle(currentLoadId, `Using native Safari HLS -> ${streamUrl}`);
      video.src = streamUrl;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;
            logLifecycle(currentLoadId, 'Native video.play() resolved; waiting for media frames');
            verifyActualPlayback(currentLoadId);
          })
          .catch((err) => {
            if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) {
              logLifecycle(
                currentLoadId,
                `Ignored native play() rejection for stale/cancelled load: ${err?.name || err}`
              );
              return;
            }
            if (err?.name === 'AbortError') {
              diagnosticsRef.current.abortErrorCount =
                (diagnosticsRef.current.abortErrorCount || 0) + 1;
              logLifecycle(
                currentLoadId,
                'Native play() interrupted by new load request (AbortError)'
              );
              return;
            }
            if (err?.name === 'NotAllowedError') {
              diagnosticsRef.current.autoplayBlocked = true;
              logLifecycle(currentLoadId, 'Native autoplay blocked; retrying muted');
              video.muted = true;
              setPlaybackState((prev) => ({ ...prev, isMuted: true }));
              const mutedPromise = video.play();
              if (mutedPromise !== undefined) {
                mutedPromise
                  .then(() => {
                    if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;
                    verifyActualPlayback(currentLoadId);
                  })
                  .catch((mErr) => {
                    if (currentLoadId !== channelLoadIdRef.current || isCancelledRef.current) return;
                    if (mErr?.name === 'AbortError') {
                      diagnosticsRef.current.abortErrorCount =
                        (diagnosticsRef.current.abortErrorCount || 0) + 1;
                      return;
                    }
                    setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
                  });
              }
              return;
            }
            console.warn(`[MuffinPlayer][load#${currentLoadId}] Native playback error:`, err);
          });
      }
    } else {
      // Media Source Extensions unsupported
      diagnosticsRef.current.unsupportedCodec = true;
      diagnosticsRef.current.stage = 'unsupported';
      cleanupHls('mse_unsupported');
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
  }, [cleanupHls, verifyActualPlayback, attachVideoListeners]);

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

  // Load stream when channel changes or mounts
  useEffect(() => {
    if (channel) {
      loadStream();
    } else {
      cleanupHls('no_channel');
      playbackStatusRef.current = 'idle';
      setPlaybackState((prev) => ({ ...prev, status: 'idle', error: null }));
    }

    return () => {
      isCancelledRef.current = true;
      cleanupHls('channel_changed_or_unmounted');
    };
  }, [channel?.id, channel?.url, loadStream, cleanupHls]);

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
