import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Channel,
  FilterState,
  PlaylistParseResult,
  PlaylistSource,
  RecentlyWatchedItem,
  UserPreferences,
} from './types';
import { playlistService } from './services/playlistService';
import { storageService } from './services/storageService';
import { useDebounce } from './hooks/useDebounce';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { VideoPlayer } from './components/player/VideoPlayer';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { EmptyState } from './components/common/EmptyState';
import { SportsPage } from './pages/SportsPage';
import { SchedulePage } from './pages/SchedulePage';
import { HomePage } from './pages/HomePage';
import { ChannelsPage } from './pages/ChannelsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HistoryPage } from './pages/HistoryPage';
import { CountriesPage } from './pages/CountriesPage';
import { LanguagesPage } from './pages/LanguagesPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  // 1. User Preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    storageService.getPreferences()
  );

  // Save preferences on modification
  const updatePreferences = useCallback(
    (updater: (prev: UserPreferences) => UserPreferences) => {
      setPreferences((prev) => {
        const next = updater(prev);
        storageService.savePreferences(next);
        return next;
      });
    },
    []
  );

  // Favorites Set for fast lookup
  const favoritesSet = useMemo(() => new Set(preferences.favorites), [preferences.favorites]);

  // 2. Playlists & Channels Data
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 3. Navigation State (Sports is default tab!)
  const [activeTab, setActiveTab] = useState<UserPreferences['activeTab']>(
    preferences.activeTab || 'sports'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // 4. Currently Playing Channel & Mini Player State
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState<boolean>(false);

  // 5. Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 250);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    country: 'all',
    language: 'all',
    sportType: 'all',
    sourceId: 'all',
    sortBy: 'name-asc',
    viewMode: preferences.viewMode,
    favoritesOnly: false,
    recentOnly: false,
  });

  // Sync debounced search to filters
  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // Sync viewMode preference
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...newFilters };
      if (newFilters.viewMode && newFilters.viewMode !== preferences.viewMode) {
        updatePreferences((p) => ({ ...p, viewMode: newFilters.viewMode! }));
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters((prev) => ({
      ...prev,
      search: '',
      category: 'all',
      country: 'all',
      language: 'all',
      sportType: 'all',
      sourceId: 'all',
      sortBy: 'name-asc',
      favoritesOnly: false,
      recentOnly: false,
    }));
  };

  // 6. Fetching Playlist (Multi-source for Sports, Single source for specific categories)
  const loadPlaylist = useCallback(
    async (playlistId: string, forceRefresh = false) => {
      setIsLoading(true);
      setFetchError(null);

      const allPlaylists = playlistService.getAvailablePlaylists(preferences.customPlaylists);
      const playlist = allPlaylists.find((p) => p.id === playlistId) || allPlaylists[0];

      try {
        let result: PlaylistParseResult;

        if (playlist.id === 'sports') {
          // Concurrently fetch and merge enabled multi-sources
          result = await playlistService.fetchMultipleSources(
            preferences.enabledSourceIds,
            preferences.customPlaylists,
            { forceRefresh }
          );
        } else {
          result = await playlistService.fetchPlaylist(playlist.url, {
            forceRefresh,
            sourceId: playlist.id,
            sourceName: playlist.name,
          });
        }

        setChannels(result.channels);
        setCategories(result.categories);
        setCountries(result.countries);
        setLanguages(result.languages);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch playlist.';
        setFetchError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [preferences.customPlaylists, preferences.enabledSourceIds]
  );

  // Initial load or when active playlist changes
  useEffect(() => {
    loadPlaylist(preferences.activePlaylistId);
  }, [preferences.activePlaylistId, preferences.enabledSourceIds, loadPlaylist]);

  // Select channel to play
  const handleSelectChannel = useCallback(
    (channel: Channel) => {
      setActiveChannel(channel);
      setIsMiniPlayer(false); // New selection expands into full view

      // Record to history and last played channel
      updatePreferences((prev) => {
        const filteredHistory = prev.recentlyWatched.filter((i) => i.channelId !== channel.id);
        const newHistoryItem: RecentlyWatchedItem = {
          channelId: channel.id,
          channel,
          watchedAt: Date.now(),
        };

        return {
          ...prev,
          lastChannelId: channel.id,
          recentlyWatched: [newHistoryItem, ...filteredHistory].slice(0, 30),
        };
      });
    },
    [updatePreferences]
  );

  // Toggle favorite channel
  const handleToggleFavorite = useCallback(
    (channelId: string) => {
      updatePreferences((prev) => {
        const exists = prev.favorites.includes(channelId);
        const updatedFavorites = exists
          ? prev.favorites.filter((id) => id !== channelId)
          : [...prev.favorites, channelId];

        return {
          ...prev,
          favorites: updatedFavorites,
        };
      });
    },
    [updatePreferences]
  );

  // Filtered and Sorted Channels Computation
  const filteredChannels = useMemo(() => {
    let result = channels;

    // Filter by tab / category shortcut
    if (activeTab === 'category' && selectedCategory !== 'all') {
      const targetCat = selectedCategory.toLowerCase();
      result = result.filter((c) => c.group.toLowerCase().includes(targetCat));
    } else if (filters.category !== 'all') {
      const targetCat = filters.category.toLowerCase();
      result = result.filter((c) => c.group.toLowerCase().includes(targetCat));
    }

    // Filter by search query across name, country, language, category
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.country && c.country.toLowerCase().includes(q)) ||
          (c.language && c.language.toLowerCase().includes(q)) ||
          c.group.toLowerCase().includes(q) ||
          (c.sportType && c.sportType.toLowerCase().includes(q))
      );
    }

    // Filter by country
    if (filters.country !== 'all') {
      result = result.filter(
        (c) => c.country?.toLowerCase() === filters.country.toLowerCase()
      );
    }

    // Filter by language
    if (filters.language !== 'all') {
      result = result.filter(
        (c) => c.language?.toLowerCase() === filters.language.toLowerCase()
      );
    }

    // Sort channels
    return [...result].sort((a, b) => {
      switch (filters.sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'name-desc':
          return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'country':
          return (a.country || 'ZZ').localeCompare(b.country || 'ZZ');
        case 'category':
          return a.group.localeCompare(b.group);
        default:
          return 0;
      }
    });
  }, [
    channels,
    activeTab,
    selectedCategory,
    filters.category,
    filters.search,
    filters.country,
    filters.language,
    filters.sortBy,
  ]);

  // Featured Channel (selected from real loaded channels, favoring non-geoblocked channels with logos)
  const featuredChannel = useMemo(() => {
    if (channels.length === 0) return null;
    return (
      channels.find(
        (c) =>
          c.logo &&
          !c.isGeoBlocked &&
          (c.group.toLowerCase().includes('sport') || c.sportType)
      ) ||
      channels.find((c) => c.logo && !c.isGeoBlocked && c.group.toLowerCase().includes('news')) ||
      channels.find((c) => c.logo && !c.isGeoBlocked) ||
      channels.find((c) => c.logo) ||
      channels[0]
    );
  }, [channels]);

  // Next / Prev Channel controls
  const handleNextChannel = useCallback(() => {
    if (!activeChannel || channels.length === 0) return;
    const currentIndex = channels.findIndex((c) => c.id === activeChannel.id);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % channels.length : 0;
    handleSelectChannel(channels[nextIndex]);
  }, [activeChannel, channels, handleSelectChannel]);

  const handlePrevChannel = useCallback(() => {
    if (!activeChannel || channels.length === 0) return;
    const currentIndex = channels.findIndex((c) => c.id === activeChannel.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : channels.length - 1;
    handleSelectChannel(channels[prevIndex]);
  }, [activeChannel, channels, handleSelectChannel]);

  // Playlist switching
  const handleSelectPlaylist = (id: string) => {
    updatePreferences((prev) => ({ ...prev, activePlaylistId: id }));
  };

  const handleToggleSourceEnabled = (sourceId: string) => {
    updatePreferences((prev) => {
      const exists = prev.enabledSourceIds.includes(sourceId);
      const nextSources = exists
        ? prev.enabledSourceIds.filter((id) => id !== sourceId)
        : [...prev.enabledSourceIds, sourceId];

      if (nextSources.length === 0) return prev; // Keep at least one enabled
      return { ...prev, enabledSourceIds: nextSources };
    });
  };

  const handleChangeConnectionTimeout = (seconds: number) => {
    updatePreferences((prev) => ({
      ...prev,
      connectionTimeoutSeconds: seconds,
    }));
  };

  const handleAddCustomPlaylist = (name: string, url: string) => {
    const newPlaylist: PlaylistSource = {
      id: `custom-${Date.now()}`,
      name,
      url,
      category: 'custom',
      description: `User-defined M3U feed: ${name}`,
    };

    updatePreferences((prev) => ({
      ...prev,
      customPlaylists: [...prev.customPlaylists, newPlaylist],
      activePlaylistId: newPlaylist.id,
    }));
  };

  const handleRemoveCustomPlaylist = (id: string) => {
    updatePreferences((prev) => {
      const remaining = prev.customPlaylists.filter((p) => p.id !== id);
      const nextActive = prev.activePlaylistId === id ? 'sports' : prev.activePlaylistId;
      return {
        ...prev,
        customPlaylists: remaining,
        activePlaylistId: nextActive,
      };
    });
  };

  // Clear data actions
  const handleClearHistory = () => {
    updatePreferences((prev) => ({ ...prev, recentlyWatched: [] }));
  };

  const handleClearFavorites = () => {
    updatePreferences((prev) => ({ ...prev, favorites: [] }));
  };

  const handleResetAllSettings = () => {
    storageService.clearPreferences();
    setPreferences(storageService.getPreferences());
  };

  // Tab change handler
  const handleSelectTab = (
    tab: UserPreferences['activeTab'],
    extra?: { category?: string }
  ) => {
    setActiveTab(tab);

    // If a channel is actively playing when navigating tabs, dock it to the mini player
    if (activeChannel) {
      setIsMiniPlayer(true);
    }

    if (tab === 'sports') {
      setSelectedCategory('all');
      if (preferences.activePlaylistId !== 'sports') {
        updatePreferences((prev) => ({ ...prev, activePlaylistId: 'sports' }));
      }
    } else if (tab === 'all' || tab === 'countries' || tab === 'languages') {
      setSelectedCategory('all');
      if (preferences.activePlaylistId !== 'master') {
        updatePreferences((prev) => ({ ...prev, activePlaylistId: 'master' }));
      }
    } else if (tab === 'category' && extra?.category) {
      setSelectedCategory(extra.category);
      const catKey = extra.category.toLowerCase();
      const matched = allAvailablePlaylists.find((p) => p.id === catKey);
      if (matched && preferences.activePlaylistId !== matched.id) {
        updatePreferences((prev) => ({ ...prev, activePlaylistId: matched.id }));
      }
    } else {
      setSelectedCategory('all');
    }
  };

  // Header Title mapping
  const currentTitle = useMemo(() => {
    switch (activeTab) {
      case 'sports':
        return 'Live Sports Center';
      case 'schedule':
        return 'Match Schedule & Portals';
      case 'home':
        return 'Home';
      case 'all':
        return 'All Channels';
      case 'category':
        return `${selectedCategory} Channels`;
      case 'countries':
        return 'Countries';
      case 'languages':
        return 'Languages';
      case 'favorites':
        return 'Favorites';
      case 'history':
        return 'Viewing History';
      case 'settings':
        return 'Settings';
      default:
        return 'Muffin Live TV';
    }
  }, [activeTab, selectedCategory]);

  const allAvailablePlaylists = useMemo(() => {
    return playlistService.getAvailablePlaylists(preferences.customPlaylists);
  }, [preferences.customPlaylists]);

  return (
    <div className="flex h-screen bg-surface-950 text-surface-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        selectedCategory={selectedCategory}
        activePlaylistId={preferences.activePlaylistId}
        onSelectTab={handleSelectTab}
        favoritesCount={preferences.favorites.length}
        historyCount={preferences.recentlyWatched.length}
        collapsed={preferences.sidebarCollapsed}
        onToggleCollapse={() =>
          updatePreferences((prev) => ({
            ...prev,
            sidebarCollapsed: !prev.sidebarCollapsed,
          }))
        }
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          playlists={allAvailablePlaylists}
          activePlaylistId={preferences.activePlaylistId}
          onSelectPlaylist={handleSelectPlaylist}
          isLoading={isLoading}
          onRefreshPlaylist={() => loadPlaylist(preferences.activePlaylistId, true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
          currentTitle={currentTitle}
          channelCount={filteredChannels.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6 pb-24 md:pb-8 overflow-y-auto">
          {/* Active Video Player (if a channel is currently chosen) */}
          {activeChannel && (
            <div className={isMiniPlayer ? '' : 'w-full'}>
              <VideoPlayer
                channel={activeChannel}
                isMiniPlayer={isMiniPlayer}
                onToggleMiniPlayer={setIsMiniPlayer}
                volume={preferences.volume}
                isMuted={preferences.isMuted}
                isFavorite={favoritesSet.has(activeChannel.id)}
                connectionTimeoutSeconds={preferences.connectionTimeoutSeconds}
                onVolumeChange={(volume, isMuted) =>
                  updatePreferences((prev) => ({ ...prev, volume, isMuted }))
                }
                onToggleFavorite={handleToggleFavorite}
                onNextChannel={handleNextChannel}
                onPrevChannel={handlePrevChannel}
                onClose={() => {
                  setActiveChannel(null);
                  setIsMiniPlayer(false);
                }}
                onSelectChannel={handleSelectChannel}
              />
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading ? (
            <LoadingSkeleton viewMode={filters.viewMode} count={18} />
          ) : fetchError ? (
            <EmptyState
              type="error"
              title="Playlist Fetch Failed"
              description={`Could not download channel list: ${fetchError}. Please check your internet connection or try another source.`}
              actionLabel="Retry Download"
              onAction={() => loadPlaylist(preferences.activePlaylistId, true)}
            />
          ) : (
            <>
              {/* Tab Views */}
              {activeTab === 'sports' && (
                <SportsPage
                  channels={channels}
                  activeChannel={activeChannel}
                  playbackStatus="playing"
                  favoritesSet={favoritesSet}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  onSelectChannel={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                  onRefreshSources={() => loadPlaylist(preferences.activePlaylistId, true)}
                />
              )}

              {activeTab === 'schedule' && <SchedulePage />}

              {activeTab === 'home' && (
                <HomePage
                  channels={filteredChannels}
                  recentlyWatched={preferences.recentlyWatched}
                  featuredChannel={featuredChannel}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  onSearchMaster={() => handleSelectPlaylist('master')}
                  onSelectCategoryShortcut={(cat) => handleSelectTab('category', { category: cat })}
                  categories={categories}
                  countries={countries}
                  languages={languages}
                  activeChannelId={activeChannel?.id || null}
                  playbackStatus="playing"
                  favoritesSet={favoritesSet}
                  onSelectChannel={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                  onClearHistory={handleClearHistory}
                />
              )}

              {(activeTab === 'all' || activeTab === 'category') && (
                <ChannelsPage
                  title={currentTitle}
                  channels={filteredChannels}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  onSearchMaster={() => handleSelectPlaylist('master')}
                  onSelectCategoryShortcut={(cat) => handleSelectTab('category', { category: cat })}
                  categories={categories}
                  countries={countries}
                  languages={languages}
                  activeChannelId={activeChannel?.id || null}
                  playbackStatus="playing"
                  favoritesSet={favoritesSet}
                  onSelectChannel={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {activeTab === 'favorites' && (
                <FavoritesPage
                  channels={channels}
                  favoritesSet={favoritesSet}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  categories={categories}
                  countries={countries}
                  languages={languages}
                  activeChannelId={activeChannel?.id || null}
                  onSelectChannel={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                  onBrowseChannels={() => setActiveTab('sports')}
                />
              )}

              {activeTab === 'history' && (
                <HistoryPage
                  recentlyWatched={preferences.recentlyWatched}
                  favoritesSet={favoritesSet}
                  onSelectChannel={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                  onClearHistory={handleClearHistory}
                  onBrowseChannels={() => setActiveTab('sports')}
                />
              )}

              {activeTab === 'countries' && (
                <CountriesPage
                  channels={channels}
                  onSelectCountry={(country) => {
                    handleFilterChange({ country });
                    setActiveTab('all');
                  }}
                />
              )}

              {activeTab === 'languages' && (
                <LanguagesPage
                  channels={channels}
                  onSelectLanguage={(language) => {
                    handleFilterChange({ language });
                    setActiveTab('all');
                  }}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPage
                  playlists={allAvailablePlaylists}
                  activePlaylistId={preferences.activePlaylistId}
                  enabledSourceIds={preferences.enabledSourceIds}
                  connectionTimeoutSeconds={preferences.connectionTimeoutSeconds}
                  onSelectPlaylist={handleSelectPlaylist}
                  onToggleSourceEnabled={handleToggleSourceEnabled}
                  onChangeConnectionTimeout={handleChangeConnectionTimeout}
                  onAddCustomPlaylist={handleAddCustomPlaylist}
                  onRemoveCustomPlaylist={handleRemoveCustomPlaylist}
                  onClearHistory={handleClearHistory}
                  onClearFavorites={handleClearFavorites}
                  onResetAllSettings={handleResetAllSettings}
                  onRefreshPlaylist={() => loadPlaylist(preferences.activePlaylistId, true)}
                  favoritesCount={preferences.favorites.length}
                  historyCount={preferences.recentlyWatched.length}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        favoritesCount={preferences.favorites.length}
        onOpenCategoriesDrawer={() => setIsMobileSidebarOpen(true)}
      />
    </div>
  );
}

export default App;
