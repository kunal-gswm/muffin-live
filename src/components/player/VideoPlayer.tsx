import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Copy,
  Check,
  Bookmark,
  X,
  Radio,
  Tv,
} from 'lucide-react';
import type { Channel } from '../../types';
import { usePlayer } from '../../hooks/usePlayer';
import { LogoFallback } from '../common/LogoFallback';

interface VideoPlayerProps {
  channel: Channel;
  volume: number;
  isMuted: boolean;
  isFavorite: boolean;
  isMiniPlayer?: boolean;
  onToggleMiniPlayer?: (mini: boolean) => void;
  onVolumeChange: (volume: number, isMuted: boolean) => void;
  onToggleFavorite: (channelId: string) => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  onClose: () => void;
  onSelectChannel?: (channel: Channel) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  volume,
  isMuted,
  isFavorite,
  isMiniPlayer: externalMini,
  onToggleMiniPlayer,
  onVolumeChange,
  onToggleFavorite,
  onNextChannel,
  onPrevChannel,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [internalMini, setInternalMini] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMini = externalMini !== undefined ? externalMini : internalMini;
  const toggleMini = () => {
    if (onToggleMiniPlayer) {
      onToggleMiniPlayer(!isMini);
    } else {
      setInternalMini((prev) => !prev);
    }
  };

  const {
    videoRef,
    containerRef,
    playbackState,
    togglePlay,
    setVolume,
    toggleMute,
    toggleFullscreen,
    retry,
  } = usePlayer({
    channel,
    initialVolume: volume,
    initialMuted: isMuted,
    onVolumeChange,
  });

  // Auto-hide controls after inactivity during active playback
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playbackState.status === 'playing') {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3500);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if focus is inside an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, playbackState.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, playbackState.volume - 0.1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevChannel();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNextChannel();
          break;
        case 'Escape':
          if (!playbackState.isFullscreen) {
            e.preventDefault();
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    toggleFullscreen,
    toggleMute,
    setVolume,
    playbackState.volume,
    playbackState.isFullscreen,
    onPrevChannel,
    onNextChannel,
    onClose,
  ]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(channel.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Failed to copy stream url:', e);
    }
  };

  const isPipAvailable = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document;

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('Picture-in-picture failed:', err);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative bg-black overflow-hidden shadow-2xl select-none group transition-all duration-200 ${
        playbackState.isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none w-full h-full'
          : isMini
          ? 'fixed bottom-20 md:bottom-6 right-4 sm:right-6 w-80 sm:w-96 max-w-[calc(100vw-2rem)] z-50 rounded-xl border border-surface-700 aspect-video'
          : 'w-full rounded-xl border border-surface-800 aspect-video max-h-[75vh]'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Top Bar (Channel title, return button, fullscreen close) */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 flex items-center justify-between z-30 ${
          controlsVisible || playbackState.status !== 'playing' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-900/80 hover:bg-surface-800 text-surface-300 hover:text-white transition-colors border border-surface-700/60"
            title="Return to browsing channels (Esc)"
            aria-label="Return to browsing"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded bg-surface-900 border border-surface-750 p-0.5 flex items-center justify-center flex-shrink-0">
            <LogoFallback
              src={channel.logo}
              alt={channel.name}
              fallbackText={channel.name}
              className="w-full h-full"
              size="sm"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {channel.name}
              </h2>
              {channel.country && (
                <span className="px-1.5 py-0.2 rounded bg-surface-800/90 text-[10px] font-mono text-surface-300 border border-surface-700">
                  {channel.country}
                </span>
              )}
            </div>
            <p className="text-xs text-surface-400 truncate">{channel.group || 'Live Stream'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Muted indicator pill */}
          {playbackState.isMuted && playbackState.status === 'playing' && (
            <button
              onClick={toggleMute}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/20 border border-accent/40 text-accent text-xs font-semibold hover:bg-accent/30 transition-colors animate-pulse"
              title="Click to unmute stream audio"
            >
              <VolumeX className="w-3.5 h-3.5 text-accent" />
              <span>Unmute</span>
            </button>
          )}

          {/* Minimize / Expand Toggle */}
          {!playbackState.isFullscreen && (
            <button
              onClick={toggleMini}
              className="p-2 rounded-lg bg-surface-900/80 hover:bg-surface-800 text-surface-300 hover:text-white transition-colors border border-surface-700/60"
              title={isMini ? 'Expand to main view' : 'Minimize to corner while browsing'}
              aria-label={isMini ? 'Expand player' : 'Minimize player'}
            >
              {isMini ? <Maximize2 className="w-4 h-4 text-accent" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(channel.id)}
            className={`p-2 rounded-lg transition-colors border ${
              isFavorite
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-surface-900/80 text-surface-300 border-surface-700/60 hover:text-white hover:bg-surface-800'
            }`}
            title={isFavorite ? 'Remove favorite' : 'Add to favorites'}
            aria-label="Favorite toggle"
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-surface-900/80 hover:bg-surface-800 text-surface-300 hover:text-white transition-colors border border-surface-700/60"
            title="Close player"
            aria-label="Close player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle State: Loading Spinner */}
      {playbackState.status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <Radio className="w-5 h-5 text-accent absolute inset-0 m-auto" />
          </div>
          <span className="text-xs font-medium text-surface-300 mt-3 tracking-wide">
            Connecting to live feed...
          </span>
        </div>
      )}

      {/* Middle State: Autoplay blocked / Paused overlay */}
      {playbackState.status === 'paused' && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-accent/90 hover:bg-accent text-surface-950 flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
            <Play className="w-7 h-7 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Middle State: Error Overlay */}
      {playbackState.status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-950/95 p-6 z-20 text-center">
          <div className="p-3 mb-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h3 className="text-sm font-semibold text-white mb-1">
            {playbackState.error?.message || 'Playback Error'}
          </h3>

          <p className="text-xs text-surface-400 max-w-md mb-4 leading-relaxed">
            {playbackState.error?.isCorsOrNetwork
              ? 'Public IPTV streams frequently rotate, restrict browser CORS origin, or go offline. You can retry, switch channels, or test the stream URL directly.'
              : playbackState.error?.details || 'Unable to decode this video stream.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={retry}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-surface-950 bg-accent hover:bg-accent-hover rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Stream
            </button>

            <button
              onClick={onNextChannel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-surface-200 bg-surface-850 hover:bg-surface-800 border border-surface-700 rounded-md transition-colors"
            >
              Next Channel
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-400 hover:text-surface-200 bg-surface-900 border border-surface-750 rounded-md transition-colors"
              title="Copy original stream URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-30 ${
          controlsVisible || playbackState.status !== 'playing' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left Controls: Prev, Play/Pause, Next, Live Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevChannel}
              className="p-1.5 rounded text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Previous channel (Left Arrow)"
              aria-label="Previous channel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={playbackState.status === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
              aria-label="Play or pause"
            >
              {playbackState.status === 'playing' ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNextChannel}
              className="p-1.5 rounded text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Next channel (Right Arrow)"
              aria-label="Next channel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Live Indicator based on actual playback state */}
            {playbackState.status === 'playing' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live</span>
              </div>
            )}
          </div>

          {/* Right Controls: Volume slider, PiP, Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Volume control */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
                title={playbackState.isMuted ? 'Unmute (M)' : 'Mute (M)'}
                aria-label="Mute toggle"
              >
                {playbackState.isMuted || playbackState.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={playbackState.isMuted ? 0 : playbackState.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20 h-1 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-accent"
                aria-label="Volume slider"
              />
            </div>

            {/* Picture in picture */}
            {isPipAvailable && (
              <button
                onClick={togglePiP}
                className="p-1.5 rounded text-surface-300 hover:text-white hover:bg-white/10 transition-colors hidden sm:block"
                title="Picture-in-Picture"
                aria-label="Picture-in-Picture"
              >
                <Tv className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Fullscreen (F)"
              aria-label="Fullscreen toggle"
            >
              {playbackState.isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
