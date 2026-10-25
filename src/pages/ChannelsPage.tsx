import React from 'react';
import type { Channel, FilterState, PlaybackStatus } from '../types';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { FilterBar } from '../components/search/FilterBar';
import { CategoryPills } from '../components/common/CategoryPills';

interface ChannelsPageProps {
  title?: string;
  channels: Channel[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onSearchMaster?: () => void;
  onSelectCategoryShortcut?: (category: string) => void;
  categories: string[];
  countries: string[];
  languages: string[];
  activeChannelId: string | null;
  playbackStatus?: PlaybackStatus;
  favoritesSet: Set<string>;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const ChannelsPage: React.FC<ChannelsPageProps> = ({
  channels,
  filters,
  onFilterChange,
  onResetFilters,
  onSearchMaster,
  onSelectCategoryShortcut,
  categories,
  countries,
  languages,
  activeChannelId,
  playbackStatus,
  favoritesSet,
  onSelectChannel,
  onToggleFavorite,
}) => {
  return (
    <div className="space-y-4">
      <CategoryPills
        activeId={filters.category}
        onSelect={(catId) => {
          if (catId === 'all') {
            onFilterChange({ category: 'all' });
          } else if (onSelectCategoryShortcut) {
            onSelectCategoryShortcut(catId);
          } else {
            onFilterChange({ category: catId });
          }
        }}
      />

      <FilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        categories={categories}
        countries={countries}
        languages={languages}
        totalMatches={channels.length}
        onResetFilters={onResetFilters}
      />

      <ChannelGrid
        channels={channels}
        viewMode={filters.viewMode}
        activeChannelId={activeChannelId}
        playbackStatus={playbackStatus}
        favoritesSet={favoritesSet}
        onSelectChannel={onSelectChannel}
        onToggleFavorite={onToggleFavorite}
        onResetFilters={onResetFilters}
        secondaryActionLabel={
          filters.search && onSearchMaster ? 'Search across Master Directory (11,000+ channels)' : undefined
        }
        onSecondaryAction={onSearchMaster}
      />
    </div>
  );
};
