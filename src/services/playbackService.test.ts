import { describe, it, expect } from 'vitest';
import {
  formatPlaybackError,
  getOfficialChannelWebsite,
  isHlsStream,
} from './playbackService';
import type { Channel } from '../types';

describe('playbackService', () => {
  const beInChannel: Channel = {
    id: 'bein-2',
    name: 'beIN Sports 2 (1080p)',
    url: 'http://primetv.cc.cd/beinfhd22/index.m3u8',
    logo: null,
    group: 'Sports',
    country: 'QA',
    language: 'Arabic',
    tvgId: 'beINSports2.qa',
  };

  const golfChannel: Channel = {
    id: 'golf-30a',
    name: '30A Golf Kingdom',
    url: 'https://30a-tv.com/feeds/vidaa/golf.m3u8',
    logo: null,
    group: 'Sports',
    country: 'US',
    language: 'English',
    tvgId: '30AGolfKingdom.us',
  };

  describe('formatPlaybackError', () => {
    it('classifies HTTP 403 as access denied without claiming regional block', () => {
      const err = formatPlaybackError('networkError', 'Forbidden', 403, beInChannel);
      expect(err.httpStatus).toBe(403);
      expect(err.category).toBe('accessDenied');
      expect(err.message).toContain('Access denied by broadcaster');
      expect(err.message).not.toContain('regional'); // Must not claim regional blocking without evidence
      expect(err.diagnosticsHelp).toContain('HTTP 403');
      expect(err.diagnosticsHelp).toContain('It does not prove regional blocking');
      expect(err.isAuthRestricted).toBe(true);
      expect(err.officialUrl).toBe('https://www.beinsports.com');
    });

    it('classifies HTTP 401 as authentication required', () => {
      const err = formatPlaybackError('networkError', 'Unauthorized', 401);
      expect(err.httpStatus).toBe(401);
      expect(err.category).toBe('authRequired');
      expect(err.message).toContain('Authentication required');
    });

    it('classifies HTTP 404 as not found', () => {
      const err = formatPlaybackError('networkError', 'Not Found', 404);
      expect(err.httpStatus).toBe(404);
      expect(err.category).toBe('notFound');
      expect(err.message).toContain('Stream URL not found');
      expect(err.canRetry).toBe(true);
    });

    it('classifies HTTP 5xx as broadcaster server error', () => {
      const err = formatPlaybackError('networkError', 'Bad Gateway', 502);
      expect(err.httpStatus).toBe(502);
      expect(err.category).toBe('serverError');
      expect(err.message).toContain('Broadcaster server error (HTTP 502)');
    });

    it('does NOT label HTTP 0 simply as CORS error, but explains CORS as one possible cause', () => {
      const err = formatPlaybackError('networkError', 'manifestLoadError', 0, golfChannel);
      expect(err.httpStatus).toBe(0);
      expect(err.category).toBe('undeterminedNetwork');
      expect(err.message).toBe('Network request failed; cause could not be determined.');
      expect(err.diagnosticsHelp).toContain('CORS is one possible cause, not a confirmed diagnosis');
      expect(err.officialUrl).toBe('https://30a-tv.com');
    });

    it('classifies manifest parsing errors accurately', () => {
      const err = formatPlaybackError('parseError', 'manifestParsingError');
      expect(err.category).toBe('manifestParsing');
      expect(err.message).toContain('Manifest parsing failed');
      expect(err.canRetry).toBe(false);
    });

    it('classifies media segment failures accurately', () => {
      const err = formatPlaybackError('networkError', 'fragLoadError', 0);
      expect(err.category).toBe('segmentFailed');
      expect(err.message).toContain('Media segment load failed');
      expect(err.canRetry).toBe(true);
    });

    it('classifies unsupported codec errors', () => {
      const err = formatPlaybackError('mediaError', 'MEDIA_ERR_DECODE');
      expect(err.category).toBe('unsupportedCodec');
      expect(err.unsupportedCodec).toBe(true);
      expect(err.canRetry).toBe(false);
    });

    it('classifies startup timeout accurately', () => {
      const err = formatPlaybackError('timeout', 'Watchdog timeout after 12s');
      expect(err.category).toBe('timeout');
      expect(err.message).toContain('Watchdog timeout');
    });
  });

  describe('getOfficialChannelWebsite', () => {
    it('returns official websites for known sports networks', () => {
      expect(getOfficialChannelWebsite(beInChannel)).toBe('https://www.beinsports.com');
      expect(getOfficialChannelWebsite(golfChannel)).toBe('https://30a-tv.com');
      expect(
        getOfficialChannelWebsite({
          id: 'rb',
          name: 'Red Bull TV',
          url: 'https://rb.example.com',
          logo: null,
          group: 'Sports',
          country: 'AT',
          language: 'EN',
          tvgId: 'rb.at',
        })
      ).toBe('https://www.redbull.com/tv');
      expect(getOfficialChannelWebsite(null)).toBeNull();
    });
  });

  describe('isHlsStream', () => {
    it('detects HLS stream URLs accurately', () => {
      expect(isHlsStream('https://example.com/live/stream.m3u8')).toBe(true);
      expect(isHlsStream('https://example.com/live/stream.m3u8?token=xyz')).toBe(true);
      expect(isHlsStream('https://example.com/live/stream.mp4')).toBe(false);
    });
  });
});
