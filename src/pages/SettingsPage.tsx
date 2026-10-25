import React, { useState } from 'react';
import {
  Settings,
  FolderOpen,
  Plus,
  Trash2,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Keyboard,
  Info,
  Check,
} from 'lucide-react';
import type { PlaylistSource } from '../types';

interface SettingsPageProps {
  playlists: PlaylistSource[];
  activePlaylistId: string;
  onSelectPlaylist: (id: string) => void;
  onAddCustomPlaylist: (name: string, url: string) => void;
  onRemoveCustomPlaylist: (id: string) => void;
  onClearHistory: () => void;
  onClearFavorites: () => void;
  onResetAllSettings: () => void;
  onRefreshPlaylist: () => void;
  favoritesCount: number;
  historyCount: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onAddCustomPlaylist,
  onRemoveCustomPlaylist,
  onClearHistory,
  onClearFavorites,
  onResetAllSettings,
  onRefreshPlaylist,
  favoritesCount,
  historyCount,
}) => {
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    const trimmedName = customName.trim();
    const trimmedUrl = customUrl.trim();

    if (!trimmedName) {
      setUrlError('Please enter a name for the playlist.');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setUrlError('Playlist URL must start with http:// or https://');
      return;
    }

    onAddCustomPlaylist(trimmedName, trimmedUrl);
    setCustomName('');
    setCustomUrl('');
    setSuccessMsg('Custom playlist added successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div className="pb-3 border-b border-surface-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-white tracking-tight">Settings & Management</h2>
        </div>
        <button
          onClick={onRefreshPlaylist}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-200 bg-surface-900 hover:bg-surface-850 border border-surface-750 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-accent" />
          Refresh Active Playlist
        </button>
      </div>

      {/* 1. Active Playlist Source */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FolderOpen className="w-4 h-4 text-accent" />
          <span>Active Playlist Source</span>
        </div>
        <p className="text-xs text-surface-400">
          Select which iptv-org directory feed to load into the application. Category feeds are optimized for fast response times.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {playlists.map((playlist) => {
            const isSelected = playlist.id === activePlaylistId;
            return (
              <div
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-accent bg-surface-850/90 ring-1 ring-accent/30'
                    : 'border-surface-750 bg-surface-950/60 hover:border-surface-700 hover:bg-surface-850/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-surface-100'}`}>
                    {playlist.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                  {playlist.description}
                </p>
                {playlist.category === 'custom' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCustomPlaylist(playlist.id);
                    }}
                    className="mt-2 text-[11px] text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Add Custom M3U Playlist */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="w-4 h-4 text-accent" />
          <span>Add Custom M3U Playlist URL</span>
        </div>

        <div className="p-3 rounded-lg bg-surface-950 border border-surface-800 flex items-start gap-2.5 text-xs text-surface-400 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            Playlists are parsed directly in your browser and never uploaded to third-party servers. Only add playlists from trusted, legitimate public providers.
          </span>
        </div>

        <form onSubmit={handleAddPlaylist} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Playlist Name (e.g. My News Channels)"
              className="sm:col-span-1 px-3 py-2 text-xs bg-surface-950 border border-surface-750 focus:border-accent text-surface-100 rounded-lg outline-none"
            />
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/playlist.m3u"
              className="sm:col-span-2 px-3 py-2 text-xs bg-surface-950 border border-surface-750 focus:border-accent text-surface-100 rounded-lg outline-none"
            />
          </div>

          {urlError && <p className="text-xs text-red-400">{urlError}</p>}
          {successMsg && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {successMsg}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-surface-950 bg-accent hover:bg-accent-hover rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Custom Playlist
            </button>
          </div>
        </form>
      </div>

      {/* 3. Keyboard Shortcuts Guide */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Keyboard className="w-4 h-4 text-accent" />
          <span>Player Keyboard Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-surface-950 border border-surface-800">
            <span className="text-surface-400">Play / Pause</span>
            <kbd className="px-2 py-0.5 rounded bg-surface-800 font-mono text-surface-200 text-[10px]">Space</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-surface-950 border border-surface-800">
            <span className="text-surface-400">Fullscreen</span>
            <kbd className="px-2 py-0.5 rounded bg-surface-800 font-mono text-surface-200 text-[10px]">F</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-surface-950 border border-surface-800">
            <span className="text-surface-400">Mute / Unmute</span>
            <kbd className="px-2 py-0.5 rounded bg-surface-800 font-mono text-surface-200 text-[10px]">M</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-surface-950 border border-surface-800">
            <span className="text-surface-400">Volume Up / Down</span>
            <kbd className="px-2 py-0.5 rounded bg-surface-800 font-mono text-surface-200 text-[10px]">↑ / ↓</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-surface-950 border border-surface-800">
            <span className="text-surface-400">Next / Prev Channel</span>
            <kbd className="px-2 py-0.5 rounded bg-surface-800 font-mono text-surface-200 text-[10px]">← / →</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-surface-950 border border-surface-800">
            <span className="text-surface-400">Exit / Close Player</span>
            <kbd className="px-2 py-0.5 rounded bg-surface-800 font-mono text-surface-200 text-[10px]">Esc</kbd>
          </div>
        </div>
      </div>

      {/* 4. Data Management (Clear Favorites, Clear History, Reset) */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Trash2 className="w-4 h-4 text-red-400" />
          <span>Local Data Management</span>
        </div>
        <p className="text-xs text-surface-400">
          Preferences and history are stored locally in your browser storage. You can purge them at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onClearFavorites}
            disabled={favoritesCount === 0}
            className="px-3.5 py-2 text-xs font-medium text-surface-300 hover:text-white bg-surface-950 hover:bg-surface-800 border border-surface-750 rounded-lg transition-colors disabled:opacity-40"
          >
            Clear Favorites ({favoritesCount})
          </button>
          <button
            onClick={onClearHistory}
            disabled={historyCount === 0}
            className="px-3.5 py-2 text-xs font-medium text-surface-300 hover:text-white bg-surface-950 hover:bg-surface-800 border border-surface-750 rounded-lg transition-colors disabled:opacity-40"
          >
            Clear History ({historyCount})
          </button>
          <button
            onClick={onResetAllSettings}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Application Settings
          </button>
        </div>
      </div>

      {/* 5. Attribution & Disclaimers */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Info className="w-4 h-4 text-accent" />
          <span>Attribution & Responsible Use</span>
        </div>
        <p className="text-xs text-surface-400 leading-relaxed">
          Channel streams and metadata are provided by the open-source community repository{' '}
          <a
            href="https://github.com/iptv-org/iptv"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline inline-flex items-center gap-0.5 ml-0.5"
          >
            iptv-org/iptv <ExternalLink className="w-3 h-3 inline" />
          </a>
          . This application does not host, broadcast, or rebroadcast any stream feeds. Stream availability depends entirely on the original broadcasting servers.
        </p>
      </div>
    </div>
  );
};
