import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayer } from './usePlayer';
import type { Channel } from '../types';

vi.mock('../services/playbackService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/playbackService')>();
  return {
    ...actual,
    canPlayNativeHls: () => true,
  };
});

const mockChannel: Channel = {
  id: 'stream-test-1',
  name: 'Test Sports Channel',
  url: 'https://example.com/test.m3u8',
  logo: null,
  group: 'Sports',
  country: 'US',
  language: 'English',
  tvgId: 'test.us',
};

describe('usePlayer hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with expected initial volume and muted state', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: null,
        initialVolume: 0.7,
        initialMuted: false,
      })
    );

    expect(result.current.playbackState.status).toBe('untested');
    expect(result.current.playbackState.volume).toBe(0.7);
    expect(result.current.playbackState.isMuted).toBe(false);
  });

  it('updates volume correctly within 0 and 1 clamp limits', () => {
    const onVolumeChange = vi.fn();
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel,
        initialVolume: 0.5,
        onVolumeChange,
      })
    );

    act(() => {
      result.current.setVolume(0.9);
    });
    expect(result.current.playbackState.volume).toBe(0.9);
    expect(onVolumeChange).toHaveBeenCalledWith(0.9, false);

    // Test clamping over 1
    act(() => {
      result.current.setVolume(1.5);
    });
    expect(result.current.playbackState.volume).toBe(1);

    // Test clamping below 0
    act(() => {
      result.current.setVolume(-0.5);
    });
    expect(result.current.playbackState.volume).toBe(0);
  });

  it('handles play and pause toggle safely', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel,
      })
    );

    expect(() => {
      act(() => {
        result.current.togglePlay();
      });
    }).not.toThrow();
  });

  it('toggles mute safely', () => {
    const onVolumeChange = vi.fn();
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel,
        initialMuted: false,
        onVolumeChange,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.playbackState.isMuted).toBe(true);
    expect(mockVideo.muted).toBe(true);
  });

  it('triggers watchdog connection timeout according to configurable timeout seconds', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel,
        connectionTimeoutSeconds: 10,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    // Trigger loadStream with the attached video element
    act(() => {
      result.current.retry();
    });

    // Connecting state active
    expect(['connecting', 'loading']).toContain(result.current.playbackState.status);

    // Advance time before timeout (8 seconds) — should still be connecting
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(['connecting', 'loading']).toContain(result.current.playbackState.status);

    // Advance past 10 seconds — watchdog should fire and transition to error
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(result.current.playbackState.status).toBe('error');
    expect(result.current.playbackState.error?.message).toContain('Connection timed out');
  });

  it('tracks diagnostics when initialized', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel,
      })
    );

    expect(result.current.diagnostics).toBeDefined();
    expect(result.current.diagnostics.everSucceededInSession).toBe(false);
  });

  it('marks playback as confirmed only when media advances currentTime or renders frame', () => {
    const { result } = renderHook(() =>
      usePlayer({
        channel: mockChannel,
      })
    );

    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    // Initially connecting
    act(() => {
      result.current.retry();
    });
    expect(result.current.playbackState.status).toBe('connecting');
    expect(result.current.playbackState.everSucceededInSession).toBeFalsy();

    // Trigger timeupdate with currentTime > 0
    Object.defineProperty(mockVideo, 'currentTime', { value: 1.2, configurable: true });
    Object.defineProperty(mockVideo, 'readyState', { value: 3, configurable: true });
    Object.defineProperty(mockVideo, 'videoWidth', { value: 1280, configurable: true });

    act(() => {
      mockVideo.dispatchEvent(new Event('timeupdate'));
    });

    expect(result.current.playbackState.status).toBe('playing');
    expect(result.current.playbackState.everSucceededInSession).toBe(true);
    expect(result.current.diagnostics.everSucceededInSession).toBe(true);
  });
});
