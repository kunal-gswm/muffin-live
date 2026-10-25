import { describe, it, expect, beforeEach } from 'vitest';
import { storageService, DEFAULT_PREFERENCES } from './storageService';
import type { UserPreferences } from '../types';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default preferences when storage is empty', () => {
    const prefs = storageService.getPreferences();
    expect(prefs.activePlaylistId).toBe(DEFAULT_PREFERENCES.activePlaylistId);
    expect(prefs.favorites).toEqual([]);
    expect(prefs.recentlyWatched).toEqual([]);
    expect(prefs.viewMode).toBe('grid');
    expect(prefs.volume).toBe(0.8);
  });

  it('saves and retrieves preferences correctly', () => {
    const customPrefs: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      activePlaylistId: 'sports',
      favorites: ['chan-1', 'chan-2'],
      viewMode: 'list',
      volume: 0.5,
      isMuted: true,
      sidebarCollapsed: true,
    };

    storageService.savePreferences(customPrefs);
    const loaded = storageService.getPreferences();

    expect(loaded.activePlaylistId).toBe('sports');
    expect(loaded.favorites).toEqual(['chan-1', 'chan-2']);
    expect(loaded.viewMode).toBe('list');
    expect(loaded.volume).toBe(0.5);
    expect(loaded.isMuted).toBe(true);
    expect(loaded.sidebarCollapsed).toBe(true);
  });

  it('handles corrupted JSON in localStorage gracefully without crashing', () => {
    localStorage.setItem('muffin_tv_preferences_v1', '{invalid-json');
    const prefs = storageService.getPreferences();
    expect(prefs.activePlaylistId).toBe(DEFAULT_PREFERENCES.activePlaylistId);
  });

  it('clears preferences cleanly', () => {
    storageService.savePreferences({
      ...DEFAULT_PREFERENCES,
      favorites: ['fav1'],
    });
    storageService.clearPreferences();
    const prefs = storageService.getPreferences();
    expect(prefs.favorites).toEqual([]);
  });
});
