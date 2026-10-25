import React from 'react';
import type { Channel, FilterState, PlaybackStatus, RecentlyWatchedItem } from '../types';
import { FeaturedChannel } from '../components/channels/FeaturedChannel';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { FilterBar } from '../components/search/FilterBar';
import { CategoryPills } from '../components/common/CategoryPills';
import { History, Play } from 'lucide-react';
import { LogoFallback } from '../components/common/LogoFallback';

interface HomePageProps {
  channels: Channel[];
  recentlyWatched: RecentlyWatchedItem[];
  featuredChannel: Channel | null;
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
  onClearHistory: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  channels,
  recentlyWatched,
  featuredChannel,
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
    <div className="space-y-6">
      {/* Featured Channel Hero (from actual playlist data) */}
      {featuredChannel && !filters.search && filters.category === 'all' && (
        <FeaturedChannel
          channel={featuredChannel}
          isFavorite={favoritesSet.has(featuredChannel.id)}
          onSelect={onSelectChannel}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Continue Watching / Recently Watched Section (if data exists) */}
      {recentlyWatched.length > 0 && !filters.search && filters.category === 'all' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Continue Watching
              </h3>
            </div>
            <span className="text-xs text-surface-400">
              {recentlyWatched.length} recently played
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recentlyWatched.slice(0, 6).map((item) => (
              <div
                key={item.channelId}
                onClick={() => onSelectChannel(item.channel)}
                className="group relative flex flex-col p-2.5 rounded-lg bg-surface-900 border border-surface-800 hover:border-surface-700 hover:bg-surface-850 cursor-pointer transition-colors text-left"
              >
                <div className="aspect-video w-full rounded bg-surface-950 p-2 flex items-center justify-center relative mb-2 overflow-hidden border border-surface-800">
                  <LogoFallback
                    src={item.channel.logo}
                    alt={item.channel.name}
                    fallbackText={item.channel.name}
                    className="w-full h-full"
                    size="sm"
                  />
                  <div className="absolute inset-0 bg-surface-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-accent text-surface-950 flex items-center justify-center shadow">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <h4 className="text-xs font-semibold text-surface-200 truncate group-hover:text-white">
                  {item.channel.name}
                </h4>
                <span className="text-[10px] text-surface-500 mt-0.5 truncate">
                  {item.channel.group}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Channel Browser Section */}
      <section className="space-y-4">
        {/* Quick Category Navigation Pills */}
        <CategoryPills
          activeId={filters.category}
          onSelect={(catId) => {
            if (catId === 'all') {
              onFilterChange({ category: 'all' });
            } else if (catId === 'favorites') {
              onFilterChange({ favoritesOnly: !filters.favoritesOnly });
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
      </section>
    </div>
  );
};
