import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayer } from './usePlayer';
import type { Channel } from '../types';

let mockHlsInstance: any = null;
const hlsHandlers = new Map<string, Function[]>();

vi.mock('hls.js', () => {
  class MockHls {
    static isSupported = vi.fn(() => true);
    static Events = {
      MEDIA_ATTACHED: 'hlsMediaAttached',
      MANIFEST_PARSED: 'hlsManifestParsed',
      ERROR: 'hlsError',
    };
    static ErrorTypes = {
      NETWORK_ERROR: 'networkError',
      MEDIA_ERROR: 'mediaError',
      OTHER_ERROR: 'otherError',
    };

    attachMedia = vi.fn();
    loadSource = vi.fn();
    stopLoad = vi.fn();
    detachMedia = vi.fn();
    destroy = vi.fn();
    recoverMediaError = vi.fn();
    startLoad = vi.fn();

    constructor() {
      mockHlsInstance = this;
      hlsHandlers.clear();
    }

    on(event: string, handler: Function) {
      if (!hlsHandlers.has(event)) {
        hlsHandlers.set(event, []);
      }
      hlsHandlers.get(event)!.push(handler);
    }
  }

  return {
    default: MockHls,
  };
});

vi.mock('../services/playbackService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/playbackService')>();
  return {
    ...actual,
    isHlsSupported: () => true,
    canPlayNativeHls: () => true,
  };
});

const mockChannel1: Channel = {
  id: 'stream-test-1',
  name: 'beIN Sports 2 (1080p)',
  url: 'http://primetv.cc.cd/beinfhd22/index.m3u8',
  logo: null,
  group: 'Sports',
  country: 'QA',
  language: 'Arabic',
  tvgId: 'beINSports2.qa',
};

const mockChannel2: Channel = {
  id: 'stream-test-2',
  name: '30A Golf Kingdom',
  url: 'https://30a-tv.com/feeds/vidaa/golf.m3u8',
  logo: null,
  group: 'Sports',
  country: 'US',
  language: 'English',
  tvgId: '30AGolfKingdom.us',
};

function triggerHlsEvent(event: string, data: any = {}) {
  const handlers = hlsHandlers.get(event) || [];
  for (const h of handlers) {
    h(event, data);
  }
}

describe('usePlayer hook regression suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    mockHlsInstance = null;
    hlsHandlers.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. Initializes in idle state when channel is null', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: null,
        initialVolume: 0.7,
        initialMuted: false,
      })
    );

    expect(result.current.playbackState.status).toBe('idle');
    expect(result.current.playbackState.volume).toBe(0.7);
    expect(result.current.playbackState.isMuted).toBe(false);
  });

  it('2. Confirms playback ONLY when media advances currentTime or renders decoded frames', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel2,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.retry();
    });

    // Enters loading state
    expect(result.current.playbackState.status).toBe('loading');
    expect(result.current.playbackState.everSucceededInSession).toBeFalsy();

    // Trigger manifest parsed — should NOT prematurely enter 'playing'
    act(() => {
      triggerHlsEvent('hlsManifestParsed', { levels: [{ details: { live: true } }] });
    });
    expect(result.current.playbackState.status).toBe('loading');

    // Simulate video playing event without frame advancement — should still NOT enter 'playing'
    act(() => {
      mockVideo.dispatchEvent(new Event('play'));
    });
    expect(result.current.playbackState.status).toBe('loading');

    // Now advance currentTime > 0 and provide video dimensions
    Object.defineProperty(mockVideo, 'currentTime', { value: 2.5, configurable: true });
    Object.defineProperty(mockVideo, 'readyState', { value: 3, configurable: true });
    Object.defineProperty(mockVideo, 'videoWidth', { value: 1280, configurable: true });
    Object.defineProperty(mockVideo, 'videoHeight', { value: 720, configurable: true });

    act(() => {
      mockVideo.dispatchEvent(new Event('timeupdate'));
    });

    // Now playback is strictly confirmed
    expect(result.current.playbackState.status).toBe('playing');
    expect(result.current.playbackState.everSucceededInSession).toBe(true);
    expect(result.current.playbackState.observedResolution).toBe('720p');
    expect(result.current.diagnostics.everSucceededInSession).toBe(true);
  });

  it('3. Handles manifest load error with status unavailable (HTTP 0) as undetermined network failure', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel2,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.retry();
    });
    expect(result.current.playbackState.status).toBe('loading');

    // Exhaust recoveries or trigger fatal manifest load failure
    act(() => {
      triggerHlsEvent('hlsError', {
        type: 'networkError',
        details: 'manifestLoadError',
        fatal: true,
        response: { code: 0 },
      });
    });

    // First recovery attempt
    expect(result.current.playbackState.status).toBe('recovering');
    expect(result.current.diagnostics.recoveryAttempts).toBe(1);

    // Second failure exhausts recovery
    act(() => {
      triggerHlsEvent('hlsError', {
        type: 'networkError',
        details: 'manifestLoadError',
        fatal: true,
        response: { code: 0 },
      });
    });

    expect(result.current.playbackState.status).toBe('error');
    expect(result.current.playbackState.error?.category).toBe('undeterminedNetwork');
    expect(result.current.playbackState.error?.message).toBe(
      'Network request failed; cause could not be determined.'
    );
    expect(result.current.playbackState.error?.diagnosticsHelp).toContain(
      'CORS is one possible cause, not a confirmed diagnosis'
    );
  });

  it('4. Handles HTTP 403 Forbidden with immediate terminal error and access denied diagnosis', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel1,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.retry();
    });

    // HTTP 403 is an explicit fatal code — must terminate immediately without retry loop
    act(() => {
      triggerHlsEvent('hlsError', {
        type: 'networkError',
        details: 'manifestLoadError',
        fatal: true,
        response: { code: 403 },
      });
    });

    expect(result.current.playbackState.status).toBe('error');
    expect(result.current.playbackState.error?.httpStatus).toBe(403);
    expect(result.current.playbackState.error?.category).toBe('accessDenied');
    expect(result.current.playbackState.error?.message).toContain('Access denied by broadcaster');
    expect(result.current.playbackState.error?.officialUrl).toBe('https://www.beinsports.com');
    // Must not loop into recovery
    expect(result.current.diagnostics.recoveryAttempts).toBe(0);
  });

  it('5. Handles manifest loads but segments fail (fragLoadError) with recovery then clean error', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel2,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.retry();
    });

    // Manifest parses
    act(() => {
      triggerHlsEvent('hlsManifestParsed', { levels: [{ details: { live: true } }] });
    });

    // Segment load error 1 -> enters recovering
    act(() => {
      triggerHlsEvent('hlsError', {
        type: 'networkError',
        details: 'fragLoadError',
        fatal: true,
      });
    });
    expect(result.current.playbackState.status).toBe('recovering');

    // Segment load error 2 -> reaches MAX_RECOVERIES and transitions to terminal error
    act(() => {
      triggerHlsEvent('hlsError', {
        type: 'networkError',
        details: 'fragLoadError',
        fatal: true,
      });
    });

    expect(result.current.playbackState.status).toBe('error');
    expect(result.current.playbackState.error?.category).toBe('segmentFailed');
    expect(result.current.playbackState.error?.message).toContain('Media segment load failed');
  });

  it('6. Handles manifest parsing failure cleanly', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel1,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.retry();
    });

    act(() => {
      triggerHlsEvent('hlsError', {
        type: 'mediaError',
        details: 'manifestParsingError',
        fatal: true,
      });
    });

    // Transition through recovery to error
    act(() => {
      triggerHlsEvent('hlsError', {
        type: 'mediaError',
        details: 'manifestParsingError',
        fatal: true,
      });
    });

    expect(result.current.playbackState.status).toBe('error');
    expect(result.current.playbackState.error?.category).toBe('manifestParsing');
  });

  it('7. Triggers watchdog startup timeout according to connectionTimeoutSeconds', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel1,
        connectionTimeoutSeconds: 8,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.retry();
    });
    expect(result.current.playbackState.status).toBe('loading');

    // Advance 6 seconds (before 8s timeout) -> still loading
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(result.current.playbackState.status).toBe('loading');

    // Advance past 8s -> watchdog fires and enters error
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(result.current.playbackState.status).toBe('error');
    expect(result.current.playbackState.error?.category).toBe('timeout');
    expect(result.current.playbackState.error?.message).toContain('Connection timed out');
  });

  it('8. Switches channels cleanly while previous request is pending without state contamination', () => {
    let currentChannel = mockChannel1;
    const { result, rerender } = renderHook(() =>
      usePlayer({
        channel: currentChannel,
        connectionTimeoutSeconds: 10,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    // Loading channel 1
    act(() => {
      result.current.retry();
    });
    expect(result.current.playbackState.status).toBe('loading');
    const firstLoadId = result.current.diagnostics.channelLoadId;
    const channel1ErrorHandlers = [...(hlsHandlers.get('hlsError') || [])];

    // Switch to channel 2 before channel 1 completes
    currentChannel = mockChannel2;
    rerender();

    expect(result.current.diagnostics.channelLoadId).toBeGreaterThan(firstLoadId!);

    // Late asynchronous callback from channel 1 arrives
    act(() => {
      for (const h of channel1ErrorHandlers) {
        h('hlsError', {
          type: 'networkError',
          details: 'manifestLoadError',
          fatal: true,
          response: { code: 403 },
        });
      }
    });

    // The current channel 2 must still be loading, not contaminated by channel 1's 403!
    expect(result.current.playbackState.status).toBe('loading');
  });

  it('9. Cleans up HLS, timeouts, and listeners when player unmounts', () => {
    const { result, unmount } = renderHook(() =>
      usePlayer({
        channel: mockChannel2,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.retry();
    });

    expect(mockHlsInstance).not.toBeNull();
    const hls = mockHlsInstance;

    unmount();

    expect(hls.stopLoad).toHaveBeenCalled();
    expect(hls.detachMedia).toHaveBeenCalled();
    expect(hls.destroy).toHaveBeenCalled();
  });

  it('10. Prevents duplicate retries and infinite loops', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel2,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.retry();
    });

    // Fire fatal errors repeatedly
    for (let i = 0; i < 5; i++) {
      act(() => {
        triggerHlsEvent('hlsError', {
          type: 'networkError',
          details: 'fragLoadError',
          fatal: true,
        });
      });
    }

    // Must be bounded in error state, recovery attempts clamped
    expect(result.current.playbackState.status).toBe('error');
    expect(result.current.diagnostics.recoveryAttempts).toBe(1);
  });
});
