import type { UserPreferences, PlaylistSource, RecentlyWatchedItem, ViewMode } from '../types';

const STORAGE_KEY = 'muffin_tv_preferences_v1';
const MAX_RECENT_CHANNELS = 30;

export const DEFAULT_PREFERENCES: UserPreferences = {
  activePlaylistId: 'sports',
  enabledSourceIds: ['sports', 'freecasthub', 'freetv'],
  connectionTimeoutSeconds: 12,
  customPlaylists: [],
  favorites: [],
  recentlyWatched: [],
  lastChannelId: null,
  viewMode: 'grid',
  volume: 0.8,
  isMuted: false,
  sidebarCollapsed: false,
  activeTab: 'sports',
};

const VALID_TABS = new Set([
  'sports',
  'home',
  'all',
  'category',
  'countries',
  'languages',
  'favorites',
  'history',
  'schedule',
  'settings',
]);

/**
 * Validates and sanitizes loaded preferences object.
 */
function sanitizePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  const data = raw as Partial<UserPreferences>;

  const favorites = Array.isArray(data.favorites)
    ? data.favorites.filter((id): id is string => typeof id === 'string')
    : [];

  const recentlyWatched = Array.isArray(data.recentlyWatched)
    ? data.recentlyWatched.filter((item): item is RecentlyWatchedItem => {
        return (
          item &&
          typeof item === 'object' &&
          typeof item.channelId === 'string' &&
          typeof item.watchedAt === 'number' &&
          item.channel &&
          typeof item.channel.url === 'string'
        );
      }).slice(0, MAX_RECENT_CHANNELS)
    : [];

  const customPlaylists = Array.isArray(data.customPlaylists)
    ? data.customPlaylists.filter((p): p is PlaylistSource => {
        return (
          p &&
          typeof p === 'object' &&
          typeof p.id === 'string' &&
          typeof p.name === 'string' &&
          typeof p.url === 'string'
        );
      })
    : [];

  const enabledSourceIds = Array.isArray(data.enabledSourceIds)
    ? data.enabledSourceIds.filter((id): id is string => typeof id === 'string')
    : DEFAULT_PREFERENCES.enabledSourceIds;

  const connectionTimeoutSeconds =
    typeof data.connectionTimeoutSeconds === 'number' &&
    !isNaN(data.connectionTimeoutSeconds) &&
    data.connectionTimeoutSeconds >= 5 &&
    data.connectionTimeoutSeconds <= 30
      ? Math.round(data.connectionTimeoutSeconds)
      : DEFAULT_PREFERENCES.connectionTimeoutSeconds;

  const viewMode: ViewMode = data.viewMode === 'list' ? 'list' : 'grid';
  const volume =
    typeof data.volume === 'number' && !isNaN(data.volume)
      ? Math.max(0, Math.min(1, data.volume))
      : DEFAULT_PREFERENCES.volume;
  const isMuted = typeof data.isMuted === 'boolean' ? data.isMuted : false;
  const sidebarCollapsed =
    typeof data.sidebarCollapsed === 'boolean' ? data.sidebarCollapsed : false;
  const activePlaylistId =
    typeof data.activePlaylistId === 'string' && data.activePlaylistId
      ? data.activePlaylistId
      : DEFAULT_PREFERENCES.activePlaylistId;
  const lastChannelId = typeof data.lastChannelId === 'string' ? data.lastChannelId : null;

  const activeTab =
    typeof data.activeTab === 'string' && VALID_TABS.has(data.activeTab)
      ? (data.activeTab as UserPreferences['activeTab'])
      : 'sports';

  return {
    activePlaylistId,
    enabledSourceIds: enabledSourceIds.length > 0 ? enabledSourceIds : DEFAULT_PREFERENCES.enabledSourceIds,
    connectionTimeoutSeconds,
    customPlaylists,
    favorites,
    recentlyWatched,
    lastChannelId,
    viewMode,
    volume,
    isMuted,
    sidebarCollapsed,
    activeTab,
  };
}

export const storageService = {
  getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_PREFERENCES };
      const parsed = JSON.parse(stored);
      return sanitizePreferences(parsed);
    } catch (e) {
      console.warn('Failed to load preferences from localStorage:', e);
      return { ...DEFAULT_PREFERENCES };
    }
  },

  savePreferences(prefs: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save preferences to localStorage:', e);
    }
  },

  clearPreferences(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear preferences:', e);
    }
  },
};
