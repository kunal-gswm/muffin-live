import React from 'react';
import {
  Menu,
  RefreshCw,
  Settings,
  FolderOpen,
} from 'lucide-react';
import type { PlaylistSource } from '../../types';
import { SearchBar } from '../search/SearchBar';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  playlists: PlaylistSource[];
  activePlaylistId: string;
  onSelectPlaylist: (id: string) => void;
  isLoading: boolean;
  onRefreshPlaylist: () => void;
  onToggleMobileSidebar: () => void;
  onOpenSettings: () => void;
  currentTitle: string;
  channelCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  isLoading,
  onRefreshPlaylist,
  onToggleMobileSidebar,
  onOpenSettings,
  currentTitle,
  channelCount,
}) => {
  return (
    <header className="sticky top-0 z-20 h-16 bg-surface-950/90 backdrop-blur border-b border-surface-800 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Hamburger (mobile) + Section Title & Badge */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 rounded-lg text-surface-400 hover:text-white md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-base font-bold text-white tracking-tight truncate hidden sm:block">
            {currentTitle}
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-surface-850 text-surface-300 border border-surface-750 flex-shrink-0">
            {channelCount}
          </span>
        </div>
      </div>

      {/* Middle: Global Search Input */}
      <div className="flex-1 max-w-md mx-2">
        <SearchBar value={searchQuery} onChange={onSearchChange} />
      </div>

      {/* Right: Playlist Switcher, Refresh button, Settings button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Playlist Selector Dropdown */}
        <div className="relative hidden lg:flex items-center">
          <FolderOpen className="w-3.5 h-3.5 text-surface-400 absolute left-2.5 pointer-events-none" />
          <select
            value={activePlaylistId}
            onChange={(e) => onSelectPlaylist(e.target.value)}
            disabled={isLoading}
            className="appearance-none pl-8 pr-7 py-1.5 text-xs bg-surface-900 border border-surface-750 hover:border-surface-700 text-surface-200 rounded-lg outline-none focus:ring-1 focus:ring-accent cursor-pointer disabled:opacity-50"
            aria-label="Active playlist selector"
          >
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefreshPlaylist}
          disabled={isLoading}
          className={`p-2 rounded-lg bg-surface-900 border border-surface-750 text-surface-300 hover:text-white hover:bg-surface-850 transition-colors ${
            isLoading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          title="Refresh current playlist from source"
          aria-label="Refresh playlist"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent' : ''}`} />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-surface-900 border border-surface-750 text-surface-300 hover:text-white hover:bg-surface-850 transition-colors"
          title="Application settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
