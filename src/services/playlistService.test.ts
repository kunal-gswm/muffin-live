import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playlistService } from './playlistService';

describe('playlistService', () => {
  beforeEach(() => {
    playlistService.clearCache();
    vi.restoreAllMocks();
  });

  it('provides built-in default playlists', () => {
    const list = playlistService.getAvailablePlaylists();
    expect(list.length).toBeGreaterThan(4);
    expect(list.some((p) => p.id === 'news')).toBe(true);
    expect(list.some((p) => p.id === 'sports')).toBe(true);
    expect(list.some((p) => p.id === 'entertainment')).toBe(true);
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
});
