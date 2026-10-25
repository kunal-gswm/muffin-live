import React from 'react';
import { Play, Bookmark, Globe, Sparkles } from 'lucide-react';
import type { Channel } from '../../types';
import { LogoFallback } from '../common/LogoFallback';

interface FeaturedChannelProps {
  channel: Channel;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const FeaturedChannel: React.FC<FeaturedChannelProps> = ({
  channel,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-surface-900 via-surface-850 to-surface-900 border border-surface-750 p-5 md:p-6 mb-6">
      {/* Subtle backdrop accent glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start md:items-center gap-4">
          {/* Logo container */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-surface-950 border border-surface-700/80 p-2 flex items-center justify-center flex-shrink-0 shadow-inner">
            <LogoFallback
              src={channel.logo}
              alt={channel.name}
              fallbackText={channel.name}
              size="lg"
              className="w-full h-full"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-accent/15 text-accent border border-accent/25">
                <Sparkles className="w-2.5 h-2.5" />
                Featured Stream
              </span>
              <span className="text-xs text-surface-400 font-medium">{channel.group}</span>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {channel.name}
            </h3>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-400">
              {channel.country && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-surface-500" />
                  {channel.country}
                </span>
              )}
              {channel.language && <span>Language: {channel.language}</span>}
              <span className="text-surface-500 font-mono text-[10px] truncate max-w-[200px]">
                {channel.tvgId || 'Direct Stream'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(channel.id)}
            className={`p-2.5 rounded-lg border transition-colors ${
              isFavorite
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-surface-800 border-surface-700 text-surface-300 hover:bg-surface-750 hover:text-white'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onSelect(channel)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-surface-950 font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            Watch Channel
          </button>
        </div>
      </div>
    </div>
  );
};
