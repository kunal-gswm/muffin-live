import type { PlaylistSource, PlaylistParseResult, Channel } from '../types';
import { parseM3U } from './m3uParser';
import { mergeSources, type SourceMergeInput } from './sourceMerger';

export const BUILTIN_PLAYLISTS: PlaylistSource[] = [
  {
    id: 'sports',
    name: 'IPTV-Org Sports',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    category: 'sports',
    description: 'Official iptv-org sports directory with global sports networks and tournaments',
    isDefault: true,
    isSportsSource: true,
    enabled: true,
  },
  {
    id: 'freecasthub',
    name: 'FreeCastHub Sports',
    url: 'https://raw.githubusercontent.com/freecasthub/public-iptv/main/sports.m3u',
    category: 'sports',
    description: 'Public OTT sports channels including Red Bull TV, FIFA+, and Motorsport.tv',
    isSportsSource: true,
    enabled: true,
  },
  {
    id: 'freetv',
    name: 'Free-TV / IPTV',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    category: 'general',
    description: 'Worldwide free-to-air public broadcasts curated by Free-TV project',
    isSportsSource: false,
    enabled: true,
  },
  {
    id: 'news',
    name: 'News',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    category: 'category',
    description: 'Global live news channels, 24/7 breaking news and current affairs',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    category: 'category',
    description: 'Variety entertainment, general television, talk shows and comedy',
  },
  {
    id: 'movies',
    name: 'Movies & Cinema',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    category: 'category',
    description: 'Films, cinema channels, and movie streams',
  },
  {
    id: 'music',
    name: 'Music',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    category: 'category',
    description: 'Music videos, live concerts, and radio television streams',
  },
  {
    id: 'documentary',
    name: 'Documentary',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    category: 'category',
    description: 'Nature, science, history, wildlife and educational channels',
  },
  {
    id: 'kids',
    name: 'Kids & Family',
    url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    category: 'category',
    description: 'Cartoons, children programming and family-friendly live feeds',
  },
  {
    id: 'master',
    name: 'All Channels (Master)',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    category: 'general',
    description: 'Complete iptv-org master directory with 10,000+ worldwide channels (~30MB download)',
  },
];

export const DEFAULT_SPORTS_SOURCES = ['sports', 'freecasthub', 'freetv'];

export const FALLBACK_SPORTS_CHANNELS: Channel[] = [
  {
    id: 'fallback-red-bull-tv',
    name: 'Red Bull TV',
    url: 'https://e7c8f7d5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWdiX1JlZEJ1bGxUVi0xX0hMUw/playlist.m3u8',
    logo: null,
    group: 'Sports',
    country: 'GLOBAL',
    language: 'English',
    tvgId: 'RedBullTV.global',
    sportType: 'other',
    sourceName: 'Configured Fallback',
    sources: ['Fallback Entry'],
    isFallback: true,
    observedHealth: 'unknown',
  },
  {
    id: 'fallback-ert-sports-1',
    name: 'ERT Sports 1',
    url: 'https://ert-ucdn.broadpeak-aas.com/bpk-tv/ERTSports1/default/index.m3u8',
    logo: null,
    group: 'Sports',
    country: 'GR',
    language: 'Greek',
    tvgId: 'ERTSports1.gr',
    sportType: 'other',
    sourceName: 'Configured Fallback',
    sources: ['Fallback Entry'],
    isFallback: true,
    observedHealth: 'unknown',
  },
  {
    id: 'fallback-acc-digital-network',
    name: 'ACC Digital Network',
    url: 'https://raycom-accdn-firetv.amagi.tv/playlist.m3u8',
    logo: null,
    group: 'Sports',
    country: 'US',
    language: 'English',
    tvgId: 'ACCDigitalNetwork.us',
    sportType: 'basketball',
    sourceName: 'Configured Fallback',
    sources: ['Fallback Entry'],
    isFallback: true,
    observedHealth: 'unknown',
  },
  {
    id: 'fallback-30a-golf-kingdom',
    name: '30A Golf Kingdom',
    url: 'https://30a-tv.com/feeds/vidaa/golf.m3u8',
    logo: null,
    group: 'Sports',
    country: 'US',
    language: 'English',
    tvgId: '30AGolfKingdom.us',
    sportType: 'other',
    sourceName: 'Configured Fallback',
    sources: ['Fallback Entry'],
    isFallback: true,
    observedHealth: 'unknown',
  },
  {
    id: 'fallback-fifa-plus-english',
    name: 'FIFA+ English',
    url: 'https://a62dad94.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZJRkFQbHVzRW5nbGlzaF9ITFM/playlist.m3u8',
    logo: null,
    group: 'Sports',
    country: 'GLOBAL',
    language: 'English',
    tvgId: 'FIFAPlus.global',
    sportType: 'football',
    sourceName: 'Configured Fallback',
    sources: ['Fallback Entry'],
    isFallback: true,
    observedHealth: 'unknown',
  },
];

interface CacheEntry {
  result: PlaylistParseResult;
  timestamp: number;
}

// In-memory cache
const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const FETCH_TIMEOUT_MS = 25000; // 25 seconds

export class PlaylistService {
  getAvailablePlaylists(customPlaylists: PlaylistSource[] = []): PlaylistSource[] {
    return [...BUILTIN_PLAYLISTS, ...customPlaylists];
  }

  getPlaylistById(id: string, customPlaylists: PlaylistSource[] = []): PlaylistSource | undefined {
    return this.getAvailablePlaylists(customPlaylists).find((p) => p.id === id);
  }

  /**
   * Fetches and parses an M3U playlist from a URL with caching, timeout, and abort support.
   */
  async fetchPlaylist(
    url: string,
    options: { forceRefresh?: boolean; signal?: AbortSignal; sourceId?: string; sourceName?: string } = {}
  ): Promise<PlaylistParseResult> {
    const { forceRefresh = false, signal, sourceId, sourceName } = options;

    // Check in-memory cache
    if (!forceRefresh) {
      const cached = memoryCache.get(url);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.result;
      }
    }

    let isTimedOut = false;
    const controller = new AbortController();

    if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'text/plain, application/x-mpegurl, audio/x-mpegurl, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const parseResult = parseM3U(text);
      parseResult.sourceId = sourceId;
      parseResult.sourceName = sourceName;

      // Save to memory cache
      memoryCache.set(url, {
        result: parseResult,
        timestamp: Date.now(),
      });

      return parseResult;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        if (isTimedOut) {
          throw new Error(`Playlist download timed out after ${FETCH_TIMEOUT_MS / 1000}s.`);
        }
        throw new Error('Playlist download cancelled.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Concurrently fetches multiple playlist sources, tolerating individual source failures,
   * and merges them with deduplication, provenance tracking, and sports classification.
   */
  async fetchMultipleSources(
    sourceIds: string[],
    customPlaylists: PlaylistSource[] = [],
    options: { forceRefresh?: boolean; signal?: AbortSignal } = {}
  ): Promise<PlaylistParseResult> {
    const { forceRefresh = false, signal } = options;
    const allAvailable = this.getAvailablePlaylists(customPlaylists);
    const targetSources = allAvailable.filter((s) => sourceIds.includes(s.id));

    if (targetSources.length === 0) {
      // Fallback to default sports
      const defaultSource = allAvailable.find((s) => s.id === 'sports') || allAvailable[0];
      targetSources.push(defaultSource);
    }

    // Fetch all requested sources concurrently
    const fetchPromises = targetSources.map(async (source) => {
      try {
        const result = await this.fetchPlaylist(source.url, {
          forceRefresh,
          signal,
          sourceId: source.id,
          sourceName: source.name,
        });
        return { source, result };
      } catch (err) {
        if (signal?.aborted) {
          throw err;
        }
        console.warn(`Failed to fetch source "${source.name}" (${source.url}):`, err);
        return null;
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    const validInputs: SourceMergeInput[] = [];

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value !== null) {
        validInputs.push(r.value);
      }
    }

    if (validInputs.length === 0) {
      if (signal?.aborted) {
        throw new Error('Playlist download cancelled.');
      }
      // If external network is temporarily unreachable, provide configured fallback channels
      console.warn('Network playlist sources unreachable; activating configured fallback sports feeds.');
      return {
        channels: FALLBACK_SPORTS_CHANNELS,
        categories: ['Sports'],
        countries: ['US', 'GR', 'GLOBAL'],
        languages: ['English', 'Greek'],
        totalParsed: FALLBACK_SPORTS_CHANNELS.length,
        errorsCount: 0,
        sourceId: 'fallback',
        sourceName: 'Configured Fallback',
        isFallback: true,
      };
    }

    // Merge sources with deduplication & sports classification
    return mergeSources(validInputs);
  }

  clearCache(url?: string): void {
    if (url) {
      memoryCache.delete(url);
    } else {
      memoryCache.clear();
    }
  }
}

export const playlistService = new PlaylistService();
