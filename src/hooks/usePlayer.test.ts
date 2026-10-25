import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayer } from './usePlayer';
import type { Channel } from '../types';

const mockChannel: Channel = {
  id: 'stream-test-1',
  name: 'Test News Channel',
  url: 'https://example.com/test.m3u8',
  logo: null,
  group: 'News',
  country: 'US',
  language: 'English',
  tvgId: 'test.us',
};

describe('usePlayer hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with expected initial volume and muted state', () => {
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

    // With no real DOM video attached, calling togglePlay doesn't crash
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

    // Create a mock video element
    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.playbackState.isMuted).toBe(true);
    expect(mockVideo.muted).toBe(true);
  });
});
