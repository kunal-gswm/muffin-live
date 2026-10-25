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
  Info,
  Zap,
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
  connectionTimeoutSeconds?: number;
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
  connectionTimeoutSeconds = 12,
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
  const [showDiagnostics, setShowDiagnostics] = useState(false);
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
    diagnostics,
    togglePlay,
    setVolume,
    toggleMute,
    toggleFullscreen,
    retry,
  } = usePlayer({
    channel,
    initialVolume: volume,
    initialMuted: isMuted,
    connectionTimeoutSeconds,
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, setVolume, onPrevChannel, onNextChannel, playbackState.volume]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(channel.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isConnectingOrLoading =
    playbackState.status === 'loading' || playbackState.status === 'connecting';
  const isFailedOrError =
    playbackState.status === 'error' || playbackState.status === 'failed';
  const isBuffering = playbackState.status === 'buffering';

  // -------------------------------------------------------------
  // Mini Player Floating View
  // -------------------------------------------------------------
  if (isMini) {
    return (
      <aside
        aria-label="Floating mini video player"
        className="fixed bottom-4 right-4 z-50 w-72 sm:w-80 md:w-96 rounded-xl overflow-hidden shadow-2xl border border-surface-700/80 bg-surface-950 flex flex-col transition-all duration-200"
      >
        <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            muted={playbackState.isMuted}
          />

          {isConnectingOrLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            </div>
          )}

          {isFailedOrError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-950/95 p-3 text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mb-1" />
              <span className="text-xs text-white font-medium">Stream Offline</span>
              <button
                onClick={onNextChannel}
                className="mt-2 text-[11px] px-2 py-1 rounded bg-accent text-surface-950 font-semibold"
              >
                Skip Next
              </button>
            </div>
          )}

          {/* Mini overlay controls */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3">
            <button
              onClick={onPrevChannel}
              className="p-1 rounded bg-black/60 text-white hover:bg-black/80"
              title="Previous channel"
              aria-label="Previous channel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-accent text-surface-950 hover:bg-accent-hover"
              title={playbackState.status === 'playing' ? 'Pause' : 'Play'}
              aria-label={playbackState.status === 'playing' ? 'Pause' : 'Play'}
            >
              {playbackState.status === 'playing' ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={onNextChannel}
              className="p-1 rounded bg-black/60 text-white hover:bg-black/80"
              title="Next channel"
              aria-label="Next channel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mini Player Metadata & Action Footer */}
        <div className="p-2.5 bg-surface-900 flex items-center justify-between gap-2 border-t border-surface-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-surface-800 shrink-0 overflow-hidden flex items-center justify-center">
              {channel.logo ? (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Tv className="w-3.5 h-3.5 text-surface-400" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">{channel.name}</h4>
              <div className="flex items-center gap-1.5 text-[10px] text-surface-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{channel.sourceName || 'Live'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleMute}
              className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-white"
              title={playbackState.isMuted ? 'Unmute' : 'Mute'}
              aria-label={playbackState.isMuted ? 'Unmute' : 'Mute'}
            >
              {playbackState.isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleMini}
              className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-white"
              title="Expand player"
              aria-label="Expand player"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-white"
              title="Close player"
              aria-label="Close player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // -------------------------------------------------------------
  // Full Player Standard View
  // -------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-surface-800 group select-none"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        playsInline
        muted={playbackState.isMuted}
        onClick={togglePlay}
      />

      {/* Top Header Controls Overlay */}
      <div
        className={`absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-30 flex items-center justify-between gap-3 ${
          controlsVisible || playbackState.status !== 'playing' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Channel Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-surface-900/90 border border-surface-700/60 p-1 shrink-0 overflow-hidden flex items-center justify-center">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <LogoFallback
                src={null}
                alt={channel.name}
                fallbackText={channel.name}
                className="w-full h-full text-xs font-bold"
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                {channel.name}
              </h2>
              {channel.quality && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-surface-800 text-surface-200 border border-surface-700 rounded">
                  {channel.quality}
                </span>
              )}
              {channel.isFallback && (
                <span
                  className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded"
                  title="Configured fallback stream (unverified live status)"
                >
                  Fallback Feed
                </span>
              )}
              {channel.sourceName && !channel.isFallback && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  {channel.sourceName}
                </span>
              )}
              {channel.sportType && channel.sportType !== 'all' && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent/15 text-accent border border-accent/30 rounded uppercase">
                  {channel.sportType}
                </span>
              )}
              {diagnostics.timeToFirstFrameMs !== null && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-surface-400 bg-surface-900/60 rounded" title="Time to first frame">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  {(diagnostics.timeToFirstFrameMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-400 mt-0.5">
              <span>{channel.country || 'Global'}</span>
              <span>•</span>
              <span>{channel.language || 'Multi'}</span>
              <span>•</span>
              <span className="text-surface-300">{channel.group}</span>
            </div>
          </div>
        </div>

        {/* Right Header Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className={`p-2 rounded-lg transition-colors border ${
              showDiagnostics
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'bg-surface-900/80 text-surface-300 border-surface-700/60 hover:text-white hover:bg-surface-800'
            }`}
            title="Stream Diagnostics & Info"
            aria-label="Stream Diagnostics"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMini}
            className="p-2 rounded-lg bg-surface-900/80 hover:bg-surface-800 text-surface-300 hover:text-white transition-colors border border-surface-700/60"
            title="Dock to mini player"
            aria-label="Dock to mini player"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

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

      {/* Diagnostics Modal / Drawer overlay */}
      {showDiagnostics && (
        <div className="absolute top-16 right-4 z-40 w-80 p-3.5 rounded-lg bg-surface-950/95 border border-surface-750 backdrop-blur-md shadow-2xl text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-800">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-accent" />
              Stream Diagnostics
            </span>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="text-surface-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 text-surface-300">
            <div className="flex justify-between">
              <span className="text-surface-400">Status:</span>
              <span className="text-white font-medium capitalize">{playbackState.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Feed Type:</span>
              <span className={channel.isFallback ? 'text-amber-400' : 'text-white'}>
                {channel.isFallback ? 'Configured Fallback' : 'Live Directory'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Source:</span>
              <span className="text-white">{channel.sourceName || 'iptv-org'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">First Playable Frame:</span>
              <span className="text-white">
                {diagnostics.timeToFirstFrameMs !== null
                  ? `${diagnostics.timeToFirstFrameMs} ms (Confirmed)`
                  : playbackState.status === 'playing'
                  ? 'Rendering'
                  : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Timeout Watchdog:</span>
              <span className="text-white">{connectionTimeoutSeconds}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Confirmed in Session:</span>
              <span className={diagnostics.everSucceededInSession ? 'text-emerald-400' : 'text-surface-400'}>
                {diagnostics.everSucceededInSession ? 'Yes (Played)' : 'No'}
              </span>
            </div>
            {diagnostics.networkErrorCode !== undefined && (
              <div className="flex justify-between">
                <span className="text-surface-400">HTTP Status:</span>
                <span className={diagnostics.networkErrorCode === 403 ? 'text-amber-400' : 'text-red-400'}>
                  HTTP {diagnostics.networkErrorCode} {diagnostics.isAuthRestricted ? '(Restricted)' : ''}
                </span>
              </div>
            )}
            {diagnostics.autoplayBlocked && (
              <div className="flex justify-between">
                <span className="text-surface-400">Autoplay Policy:</span>
                <span className="text-amber-400">Muted (Browser Restricted)</span>
              </div>
            )}
            {diagnostics.unsupportedCodec && (
              <div className="flex justify-between">
                <span className="text-surface-400">Codec Status:</span>
                <span className="text-red-400">Unsupported Codec</span>
              </div>
            )}
            {diagnostics.hlsFatalError && (
              <div className="flex justify-between">
                <span className="text-surface-400">HLS Event:</span>
                <span className="text-red-400 truncate max-w-[150px]">{diagnostics.hlsFatalError}</span>
              </div>
            )}
            <div className="pt-2 border-t border-surface-800 break-all text-[11px] text-surface-400">
              <span className="font-medium text-surface-300">Stream URL:</span>
              <p className="mt-0.5 text-surface-400 font-mono select-all">{channel.url}</p>
            </div>
          </div>
        </div>
      )}

      {/* Middle State: Loading / Connecting Spinner */}
      {isConnectingOrLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm z-20 p-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <Radio className="w-5 h-5 text-accent absolute inset-0 m-auto" />
          </div>
          <span className="text-xs font-medium text-surface-200 mt-3 tracking-wide">
            Connecting to live feed...
          </span>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={onNextChannel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-850 hover:bg-surface-800 border border-surface-700 text-xs font-medium text-surface-200 hover:text-white transition-colors shadow-sm"
              title="Skip to next channel in list"
            >
              <span>Skip to next channel</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-md bg-surface-900 hover:bg-surface-850 border border-surface-750 text-xs text-surface-400 hover:text-surface-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Middle State: Buffering indicator */}
      {isBuffering && (
        <div className="absolute top-16 left-4 z-20 flex items-center gap-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-xs border border-surface-700 text-xs text-surface-200">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
          <span>Buffering...</span>
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
      {isFailedOrError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-950/95 p-6 z-20 text-center">
          <div className="p-3 mb-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h3 className="text-sm font-semibold text-white mb-1">
            {playbackState.error?.message || 'Playback Error'}
          </h3>

          <p className="text-xs text-surface-400 max-w-md mb-4 leading-relaxed">
            {playbackState.error?.details ||
              'This public stream is currently unavailable, offline, or restricted by the broadcaster.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={onNextChannel}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-surface-950 bg-accent hover:bg-accent-hover rounded-md transition-colors shadow-sm"
            >
              Skip to Next Channel
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={retry}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-surface-200 bg-surface-850 hover:bg-surface-800 border border-surface-700 rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Stream
            </button>

            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-surface-400 hover:text-surface-200 bg-surface-900 border border-surface-750 rounded-md transition-colors"
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

            {playbackState.isLive && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[11px] font-semibold text-red-400 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>LIVE</span>
              </div>
            )}
          </div>

          {/* Right Controls: Volume, Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Volume slider */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
                title={playbackState.isMuted ? 'Unmute (M)' : 'Mute (M)'}
                aria-label="Mute toggle"
              >
                {playbackState.isMuted ? (
                  <VolumeX className="w-4 h-4 text-amber-400" />
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
                className="w-16 sm:w-20 h-1 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-accent opacity-70 group-hover/volume:opacity-100 transition-opacity"
                title="Volume control"
                aria-label="Volume slider"
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Toggle fullscreen (F)"
              aria-label="Toggle fullscreen"
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
