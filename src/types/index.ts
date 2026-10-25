export type SportType = 'all' | 'football' | 'cricket' | 'tennis' | 'basketball' | 'motorsport' | 'other';

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
  isGeoBlocked?: boolean;
  isNot247?: boolean;
  quality?: string;
  // Multi-source provenance & Sports metadata
  sourceId?: string;
  sourceName?: string;
  sources?: string[];
  sportType?: SportType;
  isInferredSport?: boolean;
  observedHealth?: 'working' | 'failing' | 'unknown';
  timeToFirstFrameMs?: number;
}

export interface PlaylistSource {
  id: string;
  name: string;
  url: string;
  category: 'sports' | 'general' | 'category' | 'country' | 'custom';
  description: string;
  isDefault?: boolean;
  isSportsSource?: boolean;
  enabled?: boolean;
}

export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'connecting'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'error'
  | 'failed'
  | 'cancelled'
  | 'ended';

export interface PlaybackError {
  message: string;
  type?: string;
  details?: string;
  isCorsOrNetwork?: boolean;
  canRetry?: boolean;
  httpStatus?: number;
}

export interface PlaybackDiagnostics {
  timeToFirstFrameMs: number | null;
  connectingStartedAt: number | null;
  everSucceededInSession: boolean;
  hlsFatalError?: string;
  networkErrorCode?: number;
  observedLatencyMs?: number;
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
  timeToFirstFrameMs?: number | null;
  everSucceededInSession?: boolean;
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'name-asc' | 'name-desc' | 'country' | 'category';

export interface FilterState {
  search: string;
  category: string;
  country: string;
  language: string;
  sportType: SportType;
  sourceId: string;
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
  enabledSourceIds: string[];
  connectionTimeoutSeconds: number;
  customPlaylists: PlaylistSource[];
  favorites: string[]; // channel IDs
  recentlyWatched: RecentlyWatchedItem[];
  lastChannelId: string | null;
  viewMode: ViewMode;
  volume: number;
  isMuted: boolean;
  sidebarCollapsed: boolean;
  activeTab:
    | 'sports'
    | 'home'
    | 'all'
    | 'category'
    | 'countries'
    | 'languages'
    | 'favorites'
    | 'history'
    | 'schedule'
    | 'settings';
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
  sourceId?: string;
  sourceName?: string;
}

export interface SourceQualityStats {
  sourceId: string;
  sourceName: string;
  totalEntries: number;
  uniqueChannels: number;
  sportsChannels: number;
  duplicateCount: number;
  duplicatePercentage: number;
  countriesCount: number;
  languagesCount: number;
  testedCount: number;
  workingCount: number;
  failingCount: number;
  avgTimeToFirstFrameMs: number | null;
}

export interface MatchFixture {
  id: string;
  sport: SportType;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO string
  status: 'upcoming' | 'live' | 'finished';
  officialBroadcasters: {
    region: string;
    broadcaster: string;
    officialUrl: string;
  }[];
  associatedChannelIds?: string[];
}
