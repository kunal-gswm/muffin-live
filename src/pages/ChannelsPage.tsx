import React from 'react';
import type { Channel, FilterState, PlaybackStatus } from '../types';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { FilterBar } from '../components/search/FilterBar';

interface ChannelsPageProps {
  title: string;
  channels: Channel[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
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
  title,
  channels,
  filters,
  onFilterChange,
  onResetFilters,
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
      <div className="flex items-center justify-between pb-2 border-b border-surface-800">
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
        <span className="text-xs text-surface-400 font-mono">
          {channels.length} {channels.length === 1 ? 'channel' : 'channels'}
        </span>
      </div>

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
      />
    </div>
  );
};
