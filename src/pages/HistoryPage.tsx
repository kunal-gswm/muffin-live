import React from 'react';
import type { RecentlyWatchedItem, Channel } from '../types';
import { History, Trash2, Play, Bookmark } from 'lucide-react';
import { LogoFallback } from '../components/common/LogoFallback';
import { EmptyState } from '../components/common/EmptyState';

interface HistoryPageProps {
  recentlyWatched: RecentlyWatchedItem[];
  favoritesSet: Set<string>;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onClearHistory: () => void;
  onBrowseChannels: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  recentlyWatched,
  favoritesSet,
  onSelectChannel,
  onToggleFavorite,
  onClearHistory,
  onBrowseChannels,
}) => {
  if (recentlyWatched.length === 0) {
    return (
      <EmptyState
        type="history"
        title="No Viewing History"
        description="Channels you tune into will automatically be recorded here so you can easily jump back in."
        actionLabel="Start Watching"
        onAction={onBrowseChannels}
      />
    );
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-white tracking-tight">Viewing History</h2>
          <span className="text-xs text-surface-400">({recentlyWatched.length})</span>
        </div>

        <button
          onClick={onClearHistory}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear History
        </button>
      </div>

      <div className="space-y-2">
        {recentlyWatched.map((item) => {
          const isFav = favoritesSet.has(item.channelId);
          return (
            <div
              key={`${item.channelId}-${item.watchedAt}`}
              onClick={() => onSelectChannel(item.channel)}
              className="group flex items-center justify-between p-3 rounded-lg bg-surface-900 border border-surface-800 hover:border-surface-700 hover:bg-surface-850 cursor-pointer transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-9 rounded bg-surface-950 border border-surface-800 p-0.5 flex items-center justify-center flex-shrink-0">
                  <LogoFallback
                    src={item.channel.logo}
                    alt={item.channel.name}
                    fallbackText={item.channel.name}
                    className="w-full h-full"
                    size="sm"
                  />
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-surface-200 truncate group-hover:text-white">
                    {item.channel.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-surface-400 mt-0.5">
                    <span>{item.channel.group}</span>
                    {item.channel.country && (
                      <>
                        <span>•</span>
                        <span>{item.channel.country}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-surface-500 font-mono">
                  {formatTimeAgo(item.watchedAt)}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.channelId);
                  }}
                  className={`p-1.5 rounded transition-colors ${
                    isFav ? 'text-amber-400' : 'text-surface-500 hover:text-surface-200'
                  }`}
                  title={isFav ? 'Remove favorite' : 'Add favorite'}
                >
                  <Bookmark className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                </button>

                <div className="w-7 h-7 rounded-full bg-surface-800 group-hover:bg-accent group-hover:text-surface-950 text-surface-400 flex items-center justify-center transition-colors">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
