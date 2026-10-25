import React, { useState } from 'react';
import {
  Settings,
  FolderOpen,
  Plus,
  Trash2,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Keyboard,
  Info,
  Check,
  Layers,
  Timer,
} from 'lucide-react';
import type { PlaylistSource } from '../types';

interface SettingsPageProps {
  playlists: PlaylistSource[];
  activePlaylistId: string;
  enabledSourceIds: string[];
  connectionTimeoutSeconds: number;
  onSelectPlaylist: (id: string) => void;
  onToggleSourceEnabled: (sourceId: string) => void;
  onChangeConnectionTimeout: (seconds: number) => void;
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
  enabledSourceIds,
  connectionTimeoutSeconds,
  onSelectPlaylist,
  onToggleSourceEnabled,
  onChangeConnectionTimeout,
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

  const sportsSources = [
    {
      id: 'sports',
      name: 'IPTV-Org Sports',
      url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
      repo: 'https://github.com/iptv-org/iptv',
      desc: 'Official sports directory with ~466 international sports feeds.',
    },
    {
      id: 'freecasthub',
      name: 'FreeCastHub Sports',
      url: 'https://raw.githubusercontent.com/freecasthub/public-iptv/main/sports.m3u',
      repo: 'https://github.com/freecasthub/public-iptv',
      desc: 'Curated public OTT sports streams (Red Bull TV, FIFA+, Motorsport.tv).',
    },
    {
      id: 'freetv',
      name: 'Free-TV Worldwide',
      url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
      repo: 'https://github.com/Free-TV/IPTV',
      desc: 'Free-to-air international broadcasts curated by the Free-TV project.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div className="pb-3 border-b border-surface-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-white tracking-tight">Settings & Source Management</h2>
        </div>
        <button
          onClick={onRefreshPlaylist}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-200 bg-surface-900 hover:bg-surface-850 border border-surface-750 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-accent" />
          Refresh Sources
        </button>
      </div>

      {/* 1. Independent Streaming Sources Toggle (Phase 2 & 4) */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="w-4 h-4 text-accent" />
            <span>Independent Streaming Sources (Sports Aggregator)</span>
          </div>
          <span className="text-xs text-surface-400 font-mono">
            {enabledSourceIds.length} active
          </span>
        </div>
        <p className="text-xs text-surface-400 leading-relaxed">
          Enable or disable authorized public sources. Playlists are fetched concurrently,
          deduplicated without merging distinct regional feeds, and cached locally.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {sportsSources.map((src) => {
            const isEnabled = enabledSourceIds.includes(src.id);
            return (
              <div
                key={src.id}
                className={`p-3.5 rounded-lg border flex flex-col justify-between transition-colors ${
                  isEnabled
                    ? 'bg-surface-850/80 border-accent/40 shadow-xs'
                    : 'bg-surface-950 border-surface-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{src.name}</span>
                    <button
                      type="button"
                      onClick={() => onToggleSourceEnabled(src.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        isEnabled ? 'bg-accent' : 'bg-surface-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface-950 shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-surface-400 leading-snug">{src.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-surface-800 flex items-center justify-between text-[10px]">
                  <a
                    href={src.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-surface-400 hover:text-accent inline-flex items-center gap-0.5"
                  >
                    GitHub repo <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <span className={isEnabled ? 'text-emerald-400 font-medium' : 'text-surface-500'}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Connection Timeout Watchdog (Phase 5) */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Timer className="w-4 h-4 text-accent" />
            <span>Connection Watchdog Timeout</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-mono text-xs font-bold">
            {connectionTimeoutSeconds} seconds
          </span>
        </div>
        <p className="text-xs text-surface-400 leading-relaxed">
          Determines how long the player waits for video segments before signaling a connection timeout.
          Higher values (12s–20s) give slower legitimate CDNs and international feeds time to connect,
          avoiding premature false timeouts.
        </p>

        <div className="flex items-center gap-4 pt-1">
          <input
            type="range"
            min="6"
            max="30"
            step="1"
            value={connectionTimeoutSeconds}
            onChange={(e) => onChangeConnectionTimeout(parseInt(e.target.value, 10))}
            className="flex-1 h-1.5 bg-surface-750 rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex items-center gap-2 text-xs font-mono text-surface-400">
            <span>6s (Aggressive)</span>
            <span>•</span>
            <span>12s (Recommended)</span>
            <span>•</span>
            <span>30s (Patient)</span>
          </div>
        </div>
      </div>

      {/* 3. Primary Directory Playlist Selector */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FolderOpen className="w-4 h-4 text-accent" />
          <span>General Category Playlists</span>
        </div>
        <p className="text-xs text-surface-400">
          Switch between specialized directory playlists. Category playlists are lightweight and load quickly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {playlists.map((playlist) => {
            const isActive = playlist.id === activePlaylistId;
            return (
              <button
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                className={`flex flex-col justify-between p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-accent/10 border-accent text-white shadow-xs'
                    : 'bg-surface-950 border-surface-800 hover:border-surface-700 text-surface-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{playlist.name}</span>
                    {isActive && <Check className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-[11px] text-surface-400 line-clamp-2 leading-relaxed">
                    {playlist.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Custom M3U Playlist Source */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="w-4 h-4 text-accent" />
          <span>Add Custom Playlist</span>
        </div>

        <form onSubmit={handleAddPlaylist} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="custom-playlist-name" className="block text-xs font-medium text-surface-300 mb-1">Playlist Name</label>
              <input
                id="custom-playlist-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. My Personal Feed"
                className="w-full px-3 py-2 text-xs bg-surface-950 border border-surface-750 rounded-lg text-white placeholder-surface-500 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="custom-playlist-url" className="block text-xs font-medium text-surface-300 mb-1">M3U / M3U8 URL</label>
              <input
                id="custom-playlist-url"
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/playlist.m3u"
                className="w-full px-3 py-2 text-xs bg-surface-950 border border-surface-750 rounded-lg text-white placeholder-surface-500 outline-none focus:border-accent"
              />
            </div>
          </div>

          {urlError && <p className="text-xs text-red-400">{urlError}</p>}
          {successMsg && <p className="text-xs text-emerald-400">{successMsg}</p>}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-surface-950 bg-accent hover:bg-accent-hover rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Playlist
          </button>
        </form>

        {playlists.filter((p) => p.category === 'custom').length > 0 && (
          <div className="pt-3 border-t border-surface-800 space-y-2">
            <span className="text-xs font-semibold text-surface-300">Active Custom Feeds</span>
            {playlists
              .filter((p) => p.category === 'custom')
              .map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between p-2 rounded bg-surface-950 border border-surface-800 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-white font-medium block truncate">{cp.name}</span>
                    <span className="text-[10px] text-surface-500 font-mono block truncate">{cp.url}</span>
                  </div>
                  <button
                    onClick={() => onRemoveCustomPlaylist(cp.id)}
                    className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Remove playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 5. Keyboard Shortcuts Reference */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Keyboard className="w-4 h-4 text-accent" />
          <span>Keyboard Shortcuts</span>
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

      {/* 6. Local Data Management (Clear Favorites, Clear History, Reset) */}
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

      {/* 7. Attribution & Disclaimers */}
      <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Info className="w-4 h-4 text-accent" />
          <span>Attribution & Responsible Streaming</span>
        </div>
        <p className="text-xs text-surface-400 leading-relaxed">
          Channel streams and metadata are provided by legitimate open-source community repositories:
          <strong className="text-surface-300"> iptv-org/iptv</strong>,
          <strong className="text-surface-300"> Free-TV/IPTV</strong>, and
          <strong className="text-surface-300"> freecasthub/public-iptv</strong>.
          This application does not host, broadcast, or rebroadcast any stream feeds. Stream availability depends entirely on the original broadcasting servers.
        </p>
      </div>
    </div>
  );
};
