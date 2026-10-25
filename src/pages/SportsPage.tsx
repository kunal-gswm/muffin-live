import React, { useMemo } from 'react';
import {
  Trophy,
  Layers,
  LayoutGrid,
  List,
  RefreshCw,
  Globe,
} from 'lucide-react';
import type { Channel, FilterState, PlaybackStatus, SportType } from '../types';
import { ChannelCard } from '../components/channels/ChannelCard';
import { ChannelRow } from '../components/channels/ChannelRow';
import { EmptyState } from '../components/common/EmptyState';

interface SportsPageProps {
  channels: Channel[];
  activeChannel: Channel | null;
  playbackStatus?: PlaybackStatus;
  favoritesSet: Set<string>;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onRefreshSources?: () => void;
}

export const SportsPage: React.FC<SportsPageProps> = ({
  channels,
  activeChannel,
  playbackStatus,
  favoritesSet,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectChannel,
  onToggleFavorite,
  onRefreshSources,
}) => {
  // 1. Isolate all sports channels (either category === 'Sports' or having a sportType)
  const sportsChannels = useMemo(() => {
    return channels.filter(
      (c) =>
        c.group.toLowerCase().includes('sport') ||
        (c.sportType && c.sportType !== 'all')
    );
  }, [channels]);

  // 2. Count channels by sport subcategory
  const subcategoryCounts = useMemo(() => {
    const counts: Record<SportType, number> = {
      all: sportsChannels.length,
      football: 0,
      cricket: 0,
      tennis: 0,
      basketball: 0,
      motorsport: 0,
      other: 0,
    };

    for (const ch of sportsChannels) {
      if (ch.sportType && ch.sportType !== 'all') {
        counts[ch.sportType] = (counts[ch.sportType] || 0) + 1;
      } else {
        counts.other = (counts.other || 0) + 1;
      }
    }
    return counts;
  }, [sportsChannels]);

  // 3. Extract unique sources, countries, and languages from sports channels
  const { sourcesList, countriesList, languagesList } = useMemo(() => {
    const sourcesSet = new Set<string>();
    const countriesSet = new Set<string>();
    const languagesSet = new Set<string>();

    for (const c of sportsChannels) {
      if (c.sourceName) sourcesSet.add(c.sourceName);
      if (c.country) countriesSet.add(c.country);
      if (c.language) languagesSet.add(c.language);
    }

    return {
      sourcesList: Array.from(sourcesSet).sort(),
      countriesList: Array.from(countriesSet).sort(),
      languagesList: Array.from(languagesSet).sort(),
    };
  }, [sportsChannels]);

  // 4. Apply subcategory, source, country, language, search, and sort filters
  const filteredSportsChannels = useMemo(() => {
    let result = sportsChannels;

    // Filter by sport subcategory
    if (filters.sportType && filters.sportType !== 'all') {
      result = result.filter((c) => c.sportType === filters.sportType);
    }

    // Filter by source
    if (filters.sourceId && filters.sourceId !== 'all') {
      result = result.filter(
        (c) => c.sourceId === filters.sourceId || c.sourceName === filters.sourceId
      );
    }

    // Filter by country
    if (filters.country && filters.country !== 'all') {
      result = result.filter((c) => c.country === filters.country);
    }

    // Filter by language
    if (filters.language && filters.language !== 'all') {
      result = result.filter((c) => c.language === filters.language);
    }

    // Filter by search query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.country?.toLowerCase().includes(q) ||
          c.language?.toLowerCase().includes(q) ||
          c.sportType?.toLowerCase().includes(q) ||
          c.sourceName?.toLowerCase().includes(q)
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      switch (filters.sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'country':
          return (a.country || 'ZZ').localeCompare(b.country || 'ZZ');
        case 'category':
          return (a.sportType || 'zzz').localeCompare(b.sportType || 'zzz');
        default:
          return 0;
      }
    });
  }, [sportsChannels, filters]);

  const sportSubcategories: Array<{ id: SportType; label: string }> = [
    { id: 'all', label: 'All Sports' },
    { id: 'football', label: 'Football' },
    { id: 'cricket', label: 'Cricket' },
    { id: 'motorsport', label: 'Motorsport' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'tennis', label: 'Tennis' },
    { id: 'other', label: 'Other Sports' },
  ];

  return (
    <div className="space-y-5">
      {/* Sports Hub Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-surface-900 via-surface-900 to-surface-850 border border-surface-800 p-4 sm:p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-accent/20 text-accent border border-accent/30">
                <Trophy className="w-4 h-4 text-accent" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Live Sports Center
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-surface-800 text-surface-300 border border-surface-700">
                {sportsChannels.length} Streams
              </span>
            </div>
            <p className="text-xs text-surface-400 max-w-xl leading-relaxed">
              Aggregated across official public directories (<strong className="text-surface-300">IPTV-Org</strong>,{' '}
              <strong className="text-surface-300">Free-TV</strong>, and{' '}
              <strong className="text-surface-300">FreeCastHub</strong>). Filtered by tournament and sport.
            </p>
          </div>

          {onRefreshSources && (
            <button
              onClick={onRefreshSources}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-750 border border-surface-700 text-xs font-medium text-surface-200 hover:text-white transition-colors self-start md:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Sources</span>
            </button>
          )}
        </div>
      </div>

      {/* Sport Subcategory Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {sportSubcategories.map((sub) => {
          const count = subcategoryCounts[sub.id] || 0;
          const isSelected = filters.sportType === sub.id;

          return (
            <button
              key={sub.id}
              onClick={() => onFilterChange({ sportType: sub.id })}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                isSelected
                  ? 'bg-accent text-surface-950 font-semibold shadow-sm'
                  : 'bg-surface-900 hover:bg-surface-850 text-surface-300 hover:text-white border border-surface-800'
              }`}
            >
              <span>{sub.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  isSelected ? 'bg-surface-950/20 text-surface-950' : 'bg-surface-800 text-surface-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Controls Bar: Source, Country, Language, Sort, View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-surface-900 border border-surface-800 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Filter */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-surface-400" />
            <select
              value={filters.sourceId}
              onChange={(e) => onFilterChange({ sourceId: e.target.value })}
              className="bg-surface-850 border border-surface-750 text-surface-200 rounded px-2.5 py-1 text-xs outline-none focus:border-accent"
              aria-label="Filter by Source"
            >
              <option value="all">All Sources ({sourcesList.length})</option>
              {sourcesList.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Country Filter */}
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-surface-400" />
            <select
              value={filters.country}
              onChange={(e) => onFilterChange({ country: e.target.value })}
              className="bg-surface-850 border border-surface-750 text-surface-200 rounded px-2.5 py-1 text-xs outline-none focus:border-accent"
              aria-label="Filter by Country"
            >
              <option value="all">All Countries</option>
              {countriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <select
            value={filters.language}
            onChange={(e) => onFilterChange({ language: e.target.value })}
            className="bg-surface-850 border border-surface-750 text-surface-200 rounded px-2.5 py-1 text-xs outline-none focus:border-accent"
            aria-label="Filter by Language"
          >
            <option value="all">All Languages</option>
            {languagesList.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
            className="bg-surface-850 border border-surface-750 text-surface-200 rounded px-2.5 py-1 text-xs outline-none focus:border-accent"
            aria-label="Sort channels"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="country">Country</option>
            <option value="category">Sport Category</option>
          </select>
        </div>

        {/* View Mode Toggle and Results Count */}
        <div className="flex items-center gap-3">
          <span className="text-surface-400 font-mono text-[11px]">
            {filteredSportsChannels.length} channels
          </span>

          <div className="flex items-center rounded-md bg-surface-850 border border-surface-750 p-0.5">
            <button
              onClick={() => onFilterChange({ viewMode: 'grid' })}
              className={`p-1 rounded ${
                filters.viewMode === 'grid'
                  ? 'bg-accent text-surface-950 font-semibold shadow-xs'
                  : 'text-surface-400 hover:text-white'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onFilterChange({ viewMode: 'list' })}
              className={`p-1 rounded ${
                filters.viewMode === 'list'
                  ? 'bg-accent text-surface-950 font-semibold shadow-xs'
                  : 'text-surface-400 hover:text-white'
              }`}
              title="List view"
              aria-label="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Channel Grid or List */}
      {filteredSportsChannels.length > 0 ? (
        filters.viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredSportsChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isActive={activeChannel?.id === channel.id}
                playbackStatus={activeChannel?.id === channel.id ? playbackStatus : undefined}
                isFavorite={favoritesSet.has(channel.id)}
                onSelect={onSelectChannel}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredSportsChannels.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                isActive={activeChannel?.id === channel.id}
                playbackStatus={activeChannel?.id === channel.id ? playbackStatus : undefined}
                isFavorite={favoritesSet.has(channel.id)}
                onSelect={onSelectChannel}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          title="No sports streams match your filters"
          description="Try selecting a different sport subcategory, clearing your search query, or checking another source."
          actionLabel="Reset Sports Filters"
          onAction={onResetFilters}
        />
      )}
    </div>
  );
};
