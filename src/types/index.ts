export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string | null;
  group: string;
  country: string | null;
  countryName?: string;
  language: string | null;
  languageName?: string;
  tvgId: string | null;
  httpUserAgent?: string;
  httpReferrer?: string;
}

export interface PlaylistSource {
  id: string;
  name: string;
  url: string;
  category: 'general' | 'category' | 'country' | 'custom';
  description: string;
  isDefault?: boolean;
}

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error' | 'ended';

export interface PlaybackError {
  message: string;
  type?: string;
  details?: string;
  isCorsOrNetwork?: boolean;
  canRetry?: boolean;
}

export interface PlaybackState {
  status: PlaybackStatus;
  error: PlaybackError | null;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLive: boolean;
  currentTime: number;
  duration: number;
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'name-asc' | 'name-desc' | 'country' | 'category';

export interface FilterState {
  search: string;
  category: string;
  country: string;
  language: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  favoritesOnly: boolean;
  recentOnly: boolean;
}

export interface RecentlyWatchedItem {
  channelId: string;
  channel: Channel;
  watchedAt: number;
}

export interface UserPreferences {
  activePlaylistId: string;
  customPlaylists: PlaylistSource[];
  favorites: string[]; // channel IDs
  recentlyWatched: RecentlyWatchedItem[];
  lastChannelId: string | null;
  viewMode: ViewMode;
  volume: number;
  isMuted: boolean;
  sidebarCollapsed: boolean;
  activeTab: 'home' | 'all' | 'category' | 'countries' | 'languages' | 'favorites' | 'history' | 'settings';
  selectedCategory?: string;
  selectedCountry?: string;
  selectedLanguage?: string;
}

export interface PlaylistParseResult {
  channels: Channel[];
  categories: string[];
  countries: string[];
  languages: string[];
  totalParsed: number;
  errorsCount: number;
}
