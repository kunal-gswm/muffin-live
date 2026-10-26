import React from 'react';
import { Bookmark, Play, Volume2, AlertTriangle, Radio, RefreshCw } from 'lucide-react';
import type { Channel, PlaybackStatus } from '../../types';
import { LogoFallback } from '../common/LogoFallback';
import { Tooltip } from '../common/Tooltip';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  playbackStatus?: PlaybackStatus;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isActive,
  playbackStatus,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(channel.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(channel);
    }
  };

  // Availability indicator is based only on actual playback state of the active channel
  const renderActualPlaybackIndicator = () => {
    if (!isActive) return null;

    if (playbackStatus === 'playing') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
          <Volume2 className="w-3 h-3 animate-pulse" />
          <span>Playing</span>
        </span>
      );
    }

    if (playbackStatus === 'loading') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">
          <Radio className="w-3 h-3 animate-spin" />
          <span>Connecting</span>
        </span>
      );
    }

    if (playbackStatus === 'buffering') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
          <Radio className="w-3 h-3 animate-spin" />
          <span>Buffering</span>
        </span>
      );
    }

    if (playbackStatus === 'recovering') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Reconnecting</span>
        </span>
      );
    }

    if (playbackStatus === 'error') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded">
          <AlertTriangle className="w-3 h-3" />
          <span>Offline</span>
        </span>
      );
    }

    return null;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="channel-card"
      onClick={() => onSelect(channel)}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col justify-between p-3 rounded-lg bg-surface-900 border transition-all duration-150 cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-accent ${
        isActive
          ? 'border-accent bg-surface-850 shadow-md ring-1 ring-accent/40'
          : 'border-surface-800 hover:border-surface-700 hover:bg-surface-850/80'
      }`}
    >
      {/* Top Banner / Logo Area */}
      <div className="relative aspect-video w-full rounded bg-surface-950 flex items-center justify-center p-2 mb-2.5 overflow-hidden border border-surface-800/80">
        <LogoFallback
          src={channel.logo}
          alt={channel.name}
          fallbackText={channel.name}
          className="w-full h-full max-h-16"
          size="md"
        />

        {/* Play hover overlay */}
        <div className="absolute inset-0 bg-surface-950/60 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-accent text-surface-950 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Quality, Geo-blocked, Sport Badges */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10 flex-wrap">
          {channel.quality && (
            <span className="px-1.5 py-0.5 rounded bg-surface-900/90 text-[9px] font-mono font-semibold text-accent border border-surface-700">
              {channel.quality}
            </span>
          )}
          {channel.isGeoBlocked && (
            <span
              className="px-1 py-0.5 rounded bg-amber-500/20 text-[9px] font-mono text-amber-400 border border-amber-500/30"
              title="Broadcaster may restrict access to specific geographic regions"
            >
              GEO
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? `Remove ${channel.name} from favorites` : `Add ${channel.name} to favorites`}
          className={`absolute top-1.5 right-1.5 p-1 rounded transition-colors z-10 ${
            isFavorite
              ? 'text-amber-400 bg-surface-900/90 hover:bg-surface-850'
              : 'text-surface-400 bg-surface-900/70 hover:text-surface-100 hover:bg-surface-900 opacity-80 group-hover:opacity-100'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Actual playback indicator in logo corner */}
        {isActive && (
          <div className="absolute bottom-1.5 left-1.5 z-10">
            {renderActualPlaybackIndicator()}
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Tooltip content={channel.name}>
            <h4 className="text-xs font-semibold text-surface-200 line-clamp-1 group-hover:text-white transition-colors">
              {channel.name}
            </h4>
          </Tooltip>
        </div>

        {/* Provenance & Sport Subcategory & Country tags */}
        <div className="flex items-center justify-between text-[11px] text-surface-400 mt-2 pt-2 border-t border-surface-800/60 gap-1">
          <div className="flex items-center gap-1 truncate">
            {channel.sportType && channel.sportType !== 'all' ? (
              <span className="px-1.5 py-0.2 rounded bg-accent/10 text-accent font-medium text-[10px] uppercase border border-accent/20">
                {channel.sportType}
              </span>
            ) : (
              <span className="truncate max-w-[85px] text-surface-400 font-medium">
                {channel.group || 'General'}
              </span>
            )}

            {channel.isFallback ? (
              <span className="px-1 py-0.2 rounded bg-amber-500/10 text-[9px] text-amber-400 border border-amber-500/20 shrink-0" title="Configured fallback feed">
                Fallback
              </span>
            ) : channel.sourceName ? (
              <span className="px-1 py-0.2 rounded bg-surface-800 text-[9px] text-surface-400 border border-surface-750 shrink-0" title={`Source: ${channel.sourceName}`}>
                {channel.sourceName.split(' ')[0]}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {channel.country && (
              <span className="px-1.5 py-0.2 rounded bg-surface-800 text-[10px] font-mono text-surface-300 border border-surface-750">
                {channel.country}
              </span>
            )}
            {channel.language && !channel.country && (
              <span className="px-1.5 py-0.2 rounded bg-surface-800 text-[10px] text-surface-300 border border-surface-750">
                {channel.language}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
