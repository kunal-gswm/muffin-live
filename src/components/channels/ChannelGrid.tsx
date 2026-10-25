import React, { useState, useEffect, useRef } from 'react';
import type { Channel, ViewMode, PlaybackStatus } from '../../types';
import { ChannelCard } from './ChannelCard';
import { ChannelRow } from './ChannelRow';
import { EmptyState } from '../common/EmptyState';
import { ArrowDown } from 'lucide-react';

interface ChannelGridProps {
  channels: Channel[];
  viewMode: ViewMode;
  activeChannelId: string | null;
  playbackStatus?: PlaybackStatus;
  favoritesSet: Set<string>;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onResetFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

const CHUNK_SIZE = 48;

export const ChannelGrid: React.FC<ChannelGridProps> = ({
  channels,
  viewMode,
  activeChannelId,
  playbackStatus,
  favoritesSet,
  onSelectChannel,
  onToggleFavorite,
  onResetFilters,
  emptyTitle,
  emptyDescription,
}) => {
  const [displayedCount, setDisplayedCount] = useState(CHUNK_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Reset displayed count whenever channels array changes
  useEffect(() => {
    setDisplayedCount(CHUNK_SIZE);
  }, [channels]);

  // Infinite scroll intersection observer
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayedCount((prev) => Math.min(prev + CHUNK_SIZE, channels.length));
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [channels.length]);

  if (channels.length === 0) {
    return (
      <EmptyState
        type="search"
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onResetFilters ? 'Clear all filters' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  const visibleChannels = channels.slice(0, displayedCount);
  const hasMore = displayedCount < channels.length;

  return (
    <div className="w-full">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {visibleChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              playbackStatus={channel.id === activeChannelId ? playbackStatus : undefined}
              isFavorite={favoritesSet.has(channel.id)}
              onSelect={onSelectChannel}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleChannels.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              playbackStatus={channel.id === activeChannelId ? playbackStatus : undefined}
              isFavorite={favoritesSet.has(channel.id)}
              onSelect={onSelectChannel}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll target / Load more button */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center items-center py-8">
          <button
            onClick={() => setDisplayedCount((prev) => Math.min(prev + CHUNK_SIZE, channels.length))}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-surface-300 bg-surface-900 hover:bg-surface-850 border border-surface-750 hover:border-surface-700 rounded-md transition-colors"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Showing {visibleChannels.length} of {channels.length} channels (Load more)
          </button>
        </div>
      )}
    </div>
  );
};
