import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playlistService } from './playlistService';

describe('playlistService', () => {
  beforeEach(() => {
    playlistService.clearCache();
    vi.restoreAllMocks();
  });

  it('provides built-in default playlists with sports prioritized', () => {
    const list = playlistService.getAvailablePlaylists();
    expect(list.length).toBeGreaterThan(4);
    expect(list.some((p) => p.id === 'sports')).toBe(true);
    expect(list.some((p) => p.id === 'freecasthub')).toBe(true);
    expect(list.some((p) => p.id === 'freetv')).toBe(true);

    const defaultSource = list.find((p) => p.isDefault);
    expect(defaultSource?.id).toBe('sports');
  });

  it('fetches and caches playlist data', async () => {
    const mockM3U = `
#EXTM3U
#EXTINF:-1 group-title="News",Test News Channel
https://example.com/stream.m3u8
    `.trim();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockM3U),
    });
    globalThis.fetch = fetchMock;

    const testUrl = 'https://example.com/test.m3u';
    const result1 = await playlistService.fetchPlaylist(testUrl);
    expect(result1.totalParsed).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call should come from memory cache without new network call
    const result2 = await playlistService.fetchPlaylist(testUrl);
    expect(result2.totalParsed).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Force refresh should trigger new network call
    await playlistService.fetchPlaylist(testUrl, { forceRefresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('handles HTTP error responses cleanly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(playlistService.fetchPlaylist('https://example.com/404.m3u')).rejects.toThrow(
      'HTTP 404: Not Found'
    );
  });

  it('concurrently fetches multiple sources and merges them', async () => {
    const mockSource1 = `
#EXTM3U
#EXTINF:-1 tvg-id="feed1" group-title="Sports",Channel 1 Sports
https://stream1.example.com/feed.m3u8
    `.trim();

    const mockSource2 = `
#EXTM3U
#EXTINF:-1 tvg-id="feed2" group-title="Sports",Channel 2 Football
https://stream2.example.com/feed.m3u8
    `.trim();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('iptv-org')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(mockSource1) });
      }
      return Promise.resolve({ ok: true, text: () => Promise.resolve(mockSource2) });
    });

    const merged = await playlistService.fetchMultipleSources(['sports', 'freecasthub']);
    expect(merged.channels.length).toBe(2);
    expect(merged.channels.some((c) => c.name.includes('Channel 1'))).toBe(true);
    expect(merged.channels.some((c) => c.name.includes('Channel 2'))).toBe(true);
  });

  it('tolerates partial source failures and preserves successful sources', async () => {
    const mockSuccess = `
#EXTM3U
#EXTINF:-1 group-title="Sports",Working Sports Channel
https://stream.ok.com/feed.m3u8
    `.trim();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('sports.m3u')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(mockSuccess) });
      }
      // Simulate 500 server error on second source
      return Promise.resolve({ ok: false, status: 500, statusText: 'Internal Error' });
    });

    const merged = await playlistService.fetchMultipleSources(['sports', 'freetv']);
    expect(merged.channels.length).toBe(1);
    expect(merged.channels[0].name).toBe('Working Sports Channel');
  });

  it('supports request cancellation via AbortSignal', async () => {
    const controller = new AbortController();
    globalThis.fetch = vi.fn().mockImplementation(() => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    controller.abort();
    await expect(
      playlistService.fetchPlaylist('https://example.com/test.m3u', { signal: controller.signal })
    ).rejects.toThrow('Playlist download cancelled or timed out.');
  });
});
