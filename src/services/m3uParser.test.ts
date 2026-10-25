import { describe, it, expect } from 'vitest';
import { parseM3U } from './m3uParser';

describe('m3uParser', () => {
  it('parses empty and invalid inputs gracefully', () => {
    expect(parseM3U('')).toEqual({
      channels: [],
      categories: [],
      countries: [],
      languages: [],
      totalParsed: 0,
      errorsCount: 0,
    });

    // @ts-expect-error testing invalid type
    expect(parseM3U(null)).toEqual({
      channels: [],
      categories: [],
      countries: [],
      languages: [],
      totalParsed: 0,
      errorsCount: 0,
    });
  });

  it('parses standard #EXTINF with quoted attributes correctly', () => {
    const m3u = `
#EXTM3U
#EXTINF:-1 tvg-id="CNN.us" tvg-name="CNN" tvg-logo="https://example.com/cnn.png" group-title="News" tvg-country="US" tvg-language="eng",CNN International
https://example.com/cnn/live.m3u8
    `.trim();

    const result = parseM3U(m3u);
    expect(result.totalParsed).toBe(1);
    expect(result.channels[0]).toMatchObject({
      name: 'CNN International',
      url: 'https://example.com/cnn/live.m3u8',
      logo: 'https://example.com/cnn.png',
      group: 'News',
      country: 'US',
      language: 'eng',
      tvgId: 'CNN.us',
    });
    expect(result.categories).toContain('News');
    expect(result.countries).toContain('US');
    expect(result.languages).toContain('eng');
  });

  it('handles single quotes and unquoted attributes', () => {
    const m3u = `
#EXTINF:-1 tvg-id='SkyNews.uk' group-title=News tvg-country=UK,Sky News Live
http://example.com/skynews.m3u8
    `.trim();

    const result = parseM3U(m3u);
    expect(result.totalParsed).toBe(1);
    expect(result.channels[0].name).toBe('Sky News Live');
    expect(result.channels[0].country).toBe('UK');
    expect(result.channels[0].group).toBe('News');
    expect(result.channels[0].tvgId).toBe('SkyNews.uk');
  });

  it('decodes HTML entities and handles commas in channel names', () => {
    const m3u = `
#EXTINF:-1 group-title="Entertainment &amp; Music",Tom &amp; Jerry &quot;Classic&quot;, 24/7
https://example.com/tomjerry.m3u8
    `.trim();

    const result = parseM3U(m3u);
    expect(result.totalParsed).toBe(1);
    expect(result.channels[0].name).toBe('Tom & Jerry "Classic", 24/7');
    expect(result.channels[0].group).toBe('Entertainment & Music');
  });

  it('handles #EXTGRP and #EXTVLCOPT headers', () => {
    const m3u = `
#EXTINF:-1 tvg-id="Sport1.de",Sport 1
#EXTGRP:Sports
#EXTVLCOPT:http-user-agent=CustomPlayer/1.0
#EXTVLCOPT:http-referrer=https://sport1.de
https://example.com/sport1.m3u8
    `.trim();

    const result = parseM3U(m3u);
    expect(result.totalParsed).toBe(1);
    expect(result.channels[0].group).toBe('Sports');
    expect(result.channels[0].httpUserAgent).toBe('CustomPlayer/1.0');
    expect(result.channels[0].httpReferrer).toBe('https://sport1.de');
  });

  it('extracts country code from iptv-org tvg-id when tvg-country is omitted', () => {
    const m3u = `
#EXTINF:-1 tvg-id="2GB.au@SD" tvg-logo="https://example.com/logo.png" group-title="News",2GB News
https://example.com/stream.m3u8
    `.trim();

    const result = parseM3U(m3u);
    expect(result.totalParsed).toBe(1);
    expect(result.channels[0].country).toBe('AU');
    expect(result.countries).toContain('AU');
  });

  it('deduplicates identical stream URLs', () => {
    const m3u = `
#EXTINF:-1,Channel Feed 1
https://example.com/stream1.m3u8
#EXTINF:-1,Channel Feed 1 Duplicate
https://example.com/stream1.m3u8
    `.trim();

    const result = parseM3U(m3u);
    expect(result.totalParsed).toBe(1);
  });

  it('ignores malformed lines and tracks error counts without crashing', () => {
    const m3u = `
#EXTINF:-1,Broken Channel
not-a-valid-url
#EXTINF:-1,Good Channel
https://example.com/good.m3u8
    `.trim();

    const result = parseM3U(m3u);
    expect(result.totalParsed).toBe(1);
    expect(result.errorsCount).toBe(1);
    expect(result.channels[0].name).toBe('Good Channel');
  });
});
