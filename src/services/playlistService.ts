import type { PlaylistSource, PlaylistParseResult } from '../types';
import { parseM3U } from './m3uParser';

export const BUILTIN_PLAYLISTS: PlaylistSource[] = [
  {
    id: 'news',
    name: 'News',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    category: 'category',
    description: 'Global live news channels, 24/7 breaking news and current affairs',
    isDefault: true,
  },
  {
    id: 'sports',
    name: 'Sports',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    category: 'category',
    description: 'Live sporting events, athletics, football, basketball and sports broadcasts',
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

interface CacheEntry {
  result: PlaylistParseResult;
  timestamp: number;
}

// In-memory cache
const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours
const FETCH_TIMEOUT_MS = 25000; // 25 seconds

export class PlaylistService {
  private activeAbortController: AbortController | null = null;

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
    options: { forceRefresh?: boolean; signal?: AbortSignal } = {}
  ): Promise<PlaylistParseResult> {
    const { forceRefresh = false, signal } = options;

    // Check in-memory cache
    if (!forceRefresh) {
      const cached = memoryCache.get(url);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.result;
      }
    }

    // Abort previous in-flight request if any
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }

    const controller = new AbortController();
    this.activeAbortController = controller;

    // Connect to external signal if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const timeoutId = setTimeout(() => {
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

      // Save to memory cache
      memoryCache.set(url, {
        result: parseResult,
        timestamp: Date.now(),
      });

      return parseResult;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Playlist download cancelled or timed out.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      if (this.activeAbortController === controller) {
        this.activeAbortController = null;
      }
    }
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
