import React from 'react';
import { Home, Tv, LayoutGrid, Bookmark, Settings } from 'lucide-react';
import type { UserPreferences } from '../../types';

interface MobileBottomNavProps {
  activeTab: UserPreferences['activeTab'];
  onSelectTab: (tab: UserPreferences['activeTab']) => void;
  favoritesCount: number;
  onOpenCategoriesDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  favoritesCount,
  onOpenCategoriesDrawer,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-surface-950/95 backdrop-blur-md border-t border-surface-800 z-40 px-3 flex items-center justify-around"
    >
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'home' ? 'text-accent font-semibold' : 'text-surface-400 hover:text-surface-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] mt-1">Home</span>
      </button>

      <button
        onClick={() => onSelectTab('all')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'all' ? 'text-accent font-semibold' : 'text-surface-400 hover:text-surface-200'
        }`}
      >
        <Tv className="w-5 h-5" />
        <span className="text-[10px] mt-1">Browse</span>
      </button>

      <button
        onClick={onOpenCategoriesDrawer}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'category' ? 'text-accent font-semibold' : 'text-surface-400 hover:text-surface-200'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="text-[10px] mt-1">Categories</span>
      </button>

      <button
        onClick={() => onSelectTab('favorites')}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'favorites' ? 'text-accent font-semibold' : 'text-surface-400 hover:text-surface-200'
        }`}
      >
        <Bookmark className="w-5 h-5" />
        <span className="text-[10px] mt-1">Favorites</span>
        {favoritesCount > 0 && (
          <span className="absolute top-0 right-1/4 -translate-y-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-accent text-surface-950 font-bold">
            {favoritesCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onSelectTab('settings')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'settings' ? 'text-accent font-semibold' : 'text-surface-400 hover:text-surface-200'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] mt-1">Settings</span>
      </button>
    </nav>
  );
};
