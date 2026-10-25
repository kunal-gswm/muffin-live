import React from 'react';
import type { Channel, FilterState, PlaybackStatus } from '../types';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { FilterBar } from '../components/search/FilterBar';
import { Bookmark } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

interface FavoritesPageProps {
  channels: Channel[];
  favoritesSet: Set<string>;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  categories: string[];
  countries: string[];
  languages: string[];
  activeChannelId: string | null;
  playbackStatus?: PlaybackStatus;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onBrowseChannels: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  channels,
  favoritesSet,
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  countries,
  languages,
  activeChannelId,
  playbackStatus,
  onSelectChannel,
  onToggleFavorite,
  onBrowseChannels,
}) => {
  const favoriteChannels = channels.filter((c) => favoritesSet.has(c.id));

  if (favoriteChannels.length === 0 && !filters.search) {
    return (
      <EmptyState
        type="favorites"
        title="Your Favorites List is Empty"
        description="Save your go-to channels for quick one-click streaming. Click the bookmark icon on any channel card while browsing."
        actionLabel="Browse Channels"
        onAction={onBrowseChannels}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-surface-800">
        <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h2 className="text-base font-bold text-white tracking-tight">Favorite Channels</h2>
        <span className="text-xs text-surface-400 ml-1">({favoriteChannels.length})</span>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        categories={categories}
        countries={countries}
        languages={languages}
        totalMatches={favoriteChannels.length}
        onResetFilters={onResetFilters}
      />

      <ChannelGrid
        channels={favoriteChannels}
        viewMode={filters.viewMode}
        activeChannelId={activeChannelId}
        playbackStatus={playbackStatus}
        favoritesSet={favoritesSet}
        onSelectChannel={onSelectChannel}
        onToggleFavorite={onToggleFavorite}
        onResetFilters={onResetFilters}
        emptyTitle="No matching favorite channels"
        emptyDescription="Try clearing your search filters to view all saved favorites."
      />
    </div>
  );
};
