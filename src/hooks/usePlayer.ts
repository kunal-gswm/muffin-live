import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import type { Channel, PlaybackState } from '../types';
import { isHlsSupported, canPlayNativeHls, formatPlaybackError } from '../services/playbackService';

interface UsePlayerOptions {
  channel: Channel | null;
  initialVolume?: number;
  initialMuted?: boolean;
  onVolumeChange?: (volume: number, isMuted: boolean) => void;
}

export function usePlayer({
  channel,
  initialVolume = 0.8,
  initialMuted = false,
  onVolumeChange,
}: UsePlayerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef<number>(0);

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: channel ? 'loading' : 'idle',
    error: null,
    volume: initialVolume,
    isMuted: initialMuted,
    isFullscreen: false,
    isLive: true,
    currentTime: 0,
    duration: 0,
  });

  // Clean up any existing HLS instance
  const cleanupHls = useCallback(() => {
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

  // Load and play the channel stream
  const loadStream = useCallback(() => {
    const video = videoRef.current;
    if (!video || !channel) {
      setPlaybackState((prev) => ({ ...prev, status: 'idle', error: null }));
      return;
    }

    cleanupHls();

    setPlaybackState((prev) => ({
      ...prev,
      status: 'loading',
      error: null,
      currentTime: 0,
      duration: 0,
    }));

    video.volume = initialVolume;
    video.muted = initialMuted;

    const streamUrl = channel.url;

    // Check MSE support with HLS.js
    if (isHlsSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 20,
        maxMaxBufferLength: 120,
        fragLoadingTimeOut: 15000,
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(streamUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const isLive = data.levels.some((lvl) => lvl.details?.live ?? true);
        setPlaybackState((prev) => ({ ...prev, isLive }));

        // Attempt playback
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            // Autoplay blocked by browser policy
            if (err.name === 'NotAllowedError') {
              setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
            } else {
              console.warn('Playback error after manifest parsed:', err);
            }
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCountRef.current < 1) {
                retryCountRef.current += 1;
                hls.startLoad();
              } else {
                const httpStatus = data.response?.code;
                const errorInfo = formatPlaybackError(
                  'networkError',
                  data.details,
                  httpStatus
                );
                cleanupHls();
                setPlaybackState((prev) => ({
                  ...prev,
                  status: 'error',
                  error: errorInfo,
                }));
              }
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              if (retryCountRef.current < 2) {
                retryCountRef.current += 1;
                hls.recoverMediaError();
              } else {
                const errorInfo = formatPlaybackError('mediaError', data.details);
                cleanupHls();
                setPlaybackState((prev) => ({
                  ...prev,
                  status: 'error',
                  error: errorInfo,
                }));
              }
              break;

            default:
              cleanupHls();
              setPlaybackState((prev) => ({
                ...prev,
                status: 'error',
                error: formatPlaybackError('other', data.details),
              }));
              break;
          }
        }
      });
    } else if (canPlayNativeHls(video)) {
      // Native Safari HLS
      video.src = streamUrl;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name === 'NotAllowedError') {
            setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
          }
        });
      }
    } else {
      // MSE not supported
      setPlaybackState((prev) => ({
        ...prev,
        status: 'error',
        error: {
          message: 'Your browser does not support HLS streaming video.',
          details: 'Media Source Extensions (MSE) unsupported',
          canRetry: false,
        },
      }));
    }
  }, [channel, cleanupHls, initialVolume, initialMuted]);

  // Video element event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setPlaybackState((prev) => ({ ...prev, status: 'playing', error: null }));
    };

    const onPause = () => {
      setPlaybackState((prev) => {
        if (prev.status === 'playing') {
          return { ...prev, status: 'paused' };
        }
        return prev;
      });
    };

    const onWaiting = () => {
      setPlaybackState((prev) => {
        if (prev.status === 'playing') {
          return { ...prev, status: 'loading' };
        }
        return prev;
      });
    };

    const onPlaying = () => {
      setPlaybackState((prev) => ({ ...prev, status: 'playing' }));
    };

    const onTimeUpdate = () => {
      setPlaybackState((prev) => ({
        ...prev,
        currentTime: video.currentTime,
        duration: isNaN(video.duration) ? 0 : video.duration,
      }));
    };

    const onError = () => {
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
            break;
          case 4:
            details = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
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
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('error', onError);
    };
  }, []);

  // Listen for fullscreen change
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
    togglePlay,
    setVolume,
    toggleMute,
    toggleFullscreen,
    retry,
  };
}
