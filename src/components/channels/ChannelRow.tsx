import React from 'react';
import { Bookmark, Play, Volume2, AlertTriangle, Radio } from 'lucide-react';
import type { Channel, PlaybackStatus } from '../../types';
import { LogoFallback } from '../common/LogoFallback';
import { Tooltip } from '../common/Tooltip';

interface ChannelRowProps {
  channel: Channel;
  isActive: boolean;
  playbackStatus?: PlaybackStatus;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const ChannelRow: React.FC<ChannelRowProps> = ({
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(channel)}
      onKeyDown={handleKeyDown}
      className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150 cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-accent ${
        isActive
          ? 'border-accent bg-surface-850 shadow-sm ring-1 ring-accent/30'
          : 'border-surface-800 bg-surface-900 hover:border-surface-700 hover:bg-surface-850/80'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo thumbnail */}
        <div className="relative w-12 h-9 flex-shrink-0 bg-surface-950 rounded border border-surface-800 p-0.5 flex items-center justify-center">
          <LogoFallback
            src={channel.logo}
            alt={channel.name}
            fallbackText={channel.name}
            className="w-full h-full"
            size="sm"
          />
        </div>

        {/* Channel Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Tooltip content={channel.name}>
              <h4 className="text-xs font-semibold text-surface-200 truncate group-hover:text-white max-w-[260px] sm:max-w-[400px]">
                {channel.name}
              </h4>
            </Tooltip>

            {/* Playback status indicator if active */}
            {isActive && playbackStatus === 'playing' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <Volume2 className="w-2.5 h-2.5 animate-pulse" />
                <span>Playing</span>
              </span>
            )}
            {isActive && playbackStatus === 'loading' && (
              <span className="flex items-center gap-1 text-[10px] text-sky-400 font-medium bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                <Radio className="w-2.5 h-2.5 animate-spin" />
                <span>Buffering</span>
              </span>
            )}
            {isActive && playbackStatus === 'error' && (
              <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Offline</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-surface-400">
            <span>{channel.group || 'General'}</span>
            {channel.language && (
              <>
                <span>•</span>
                <span>{channel.language}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {channel.country && (
          <span className="px-2 py-0.5 rounded bg-surface-800 text-[10px] font-mono text-surface-300 border border-surface-750">
            {channel.country}
          </span>
        )}

        {/* Favorite toggle */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`p-1.5 rounded transition-colors ${
            isFavorite
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-surface-500 hover:text-surface-200'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        <div className="w-7 h-7 rounded-full bg-surface-800 group-hover:bg-accent group-hover:text-surface-950 text-surface-400 flex items-center justify-center transition-colors">
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        </div>
      </div>
    </div>
  );
};
