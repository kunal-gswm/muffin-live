import { describe, it, expect } from 'vitest';
import { mergeSources, getUrlFingerprint, getDeduplicationKey } from './sourceMerger';
import type { Channel, PlaylistParseResult, PlaylistSource } from '../types';

describe('sourceMerger', () => {
  const sourceA: PlaylistSource = {
    id: 'iptv-org',
    name: 'IPTV-Org Sports',
    url: 'https://example.com/a.m3u',
    category: 'sports',
    description: 'Source A',
  };

  const sourceB: PlaylistSource = {
    id: 'freetv',
    name: 'Free-TV',
    url: 'https://example.com/b.m3u',
    category: 'general',
    description: 'Source B',
  };

  it('correctly normalizes URL fingerprints', () => {
    const url1 = 'https://stream.server.com/live/feed.m3u8?token=xyz123';
    const url2 = 'https://stream.server.com/live/feed.m3u8';
    expect(getUrlFingerprint(url1)).toBe(getUrlFingerprint(url2));
  });

  it('merges identical channels from multiple sources and records provenance', () => {
    const channel1: Channel = {
      id: 'ch-1',
      name: 'Red Bull TV',
      url: 'https://stream.example.com/redbull.m3u8',
      logo: null,
      group: 'Sports',
      country: 'GLOBAL',
      language: 'ENG',
      tvgId: 'RedBullTV.global',
    };

    const channel2: Channel = {
      id: 'ch-2',
      name: 'Red Bull TV',
      url: 'https://stream.example.com/redbull.m3u8?token=abc',
      logo: 'https://example.com/redbull.png',
      group: 'Sports',
      country: 'GLOBAL',
      language: 'ENG',
      tvgId: 'RedBullTV.global',
    };

    const resultA: PlaylistParseResult = {
      channels: [channel1],
      categories: ['Sports'],
      countries: ['GLOBAL'],
      languages: ['ENG'],
      totalParsed: 1,
      errorsCount: 0,
    };

    const resultB: PlaylistParseResult = {
      channels: [channel2],
      categories: ['Sports'],
      countries: ['GLOBAL'],
      languages: ['ENG'],
      totalParsed: 1,
      errorsCount: 0,
    };

    const merged = mergeSources([
      { source: sourceA, result: resultA },
      { source: sourceB, result: resultB },
    ]);

    expect(merged.channels.length).toBe(1);
    expect(merged.channels[0].sources).toContain('IPTV-Org Sports');
    expect(merged.channels[0].sources).toContain('Free-TV');
    // Keeps better logo
    expect(merged.channels[0].logo).toBe('https://example.com/redbull.png');
  });

  it('preserves distinct regional feeds without incorrectly merging them', () => {
    const bbcEast: Channel = {
      id: 'bbc-east',
      name: 'BBC One East',
      url: 'https://stream.bbc.com/east.m3u8',
      logo: null,
      group: 'General',
      country: 'UK',
      language: 'ENG',
      tvgId: 'BBCOneEast.uk',
    };

    const bbcWest: Channel = {
      id: 'bbc-west',
      name: 'BBC One West',
      url: 'https://stream.bbc.com/west.m3u8',
      logo: null,
      group: 'General',
      country: 'UK',
      language: 'ENG',
      tvgId: 'BBCOneWest.uk',
    };

    const result: PlaylistParseResult = {
      channels: [bbcEast, bbcWest],
      categories: ['General'],
      countries: ['UK'],
      languages: ['ENG'],
      totalParsed: 2,
      errorsCount: 0,
    };

    const merged = mergeSources([{ source: sourceA, result }]);

    expect(merged.channels.length).toBe(2);
    expect(merged.channels.map((c) => c.name)).toContain('BBC One East');
    expect(merged.channels.map((c) => c.name)).toContain('BBC One West');
  });

  it('preserves distinct alternative feeds with different stream URLs', () => {
    const feed1: Channel = {
      id: 'espn-primary',
      name: 'ESPN Alternative 1',
      url: 'https://stream1.espn.com/live.m3u8',
      logo: null,
      group: 'Sports',
      country: 'US',
      language: 'ENG',
      tvgId: null,
    };

    const feed2: Channel = {
      id: 'espn-secondary',
      name: 'ESPN Alternative 2',
      url: 'https://stream2.espn.com/live.m3u8',
      logo: null,
      group: 'Sports',
      country: 'US',
      language: 'ENG',
      tvgId: null,
    };

    const result: PlaylistParseResult = {
      channels: [feed1, feed2],
      categories: ['Sports'],
      countries: ['US'],
      languages: ['ENG'],
      totalParsed: 2,
      errorsCount: 0,
    };

    const merged = mergeSources([{ source: sourceA, result }]);
    expect(merged.channels.length).toBe(2);
  });
});
