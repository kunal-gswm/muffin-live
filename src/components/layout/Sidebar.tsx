import React from 'react';
import {
  Home,
  Tv,
  Trophy,
  Newspaper,
  Film,
  Clapperboard,
  Globe,
  Languages,
  Bookmark,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  X,
} from 'lucide-react';
import type { UserPreferences } from '../../types';

interface SidebarProps {
  activeTab: UserPreferences['activeTab'];
  onSelectTab: (tab: UserPreferences['activeTab'], extra?: { category?: string }) => void;
  favoritesCount: number;
  historyCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  favoritesCount,
  historyCount,
  collapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'all' as const, label: 'All Channels', icon: Tv },
  ];

  const categoryShortcuts = [
    { category: 'News', label: 'News', icon: Newspaper },
    { category: 'Sports', label: 'Sports', icon: Trophy },
    { category: 'Entertainment', label: 'Entertainment', icon: Film },
    { category: 'Movies', label: 'Movies', icon: Clapperboard },
  ];

  const discoveryItems = [
    { id: 'countries' as const, label: 'Countries', icon: Globe },
    { id: 'languages' as const, label: 'Languages', icon: Languages },
  ];

  const userItems = [
    { id: 'favorites' as const, label: 'Favorites', icon: Bookmark, badge: favoritesCount },
    { id: 'history' as const, label: 'Recently Watched', icon: History, badge: historyCount },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-900 border-r border-surface-800 text-surface-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-surface-800 flex-shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent flex-shrink-0">
            <Radio className="w-4 h-4 text-accent" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                Muffin Live TV
              </span>
              <span className="text-[10px] text-surface-400 tracking-wider uppercase mt-1">
                OpenStream
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="p-1 rounded-md text-surface-400 hover:text-white md:hidden"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop collapse button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-md text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Collapse sidebar toggle"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav links scroll area */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-6">
        {/* Main section */}
        <div>
          {!collapsed && (
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
              Browse
            </p>
          )}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
                      : 'hover:bg-surface-800 hover:text-surface-100 text-surface-400'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent' : ''}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories Section */}
        <div>
          {!collapsed && (
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
              Categories
            </p>
          )}
          <div className="space-y-1">
            {categoryShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.category}
                  onClick={() => {
                    onSelectTab('category', { category: item.category });
                    onCloseMobile();
                  }}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors text-left"
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 text-surface-400" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explore Section */}
        <div>
          {!collapsed && (
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
              Explore
            </p>
          )}
          <div className="space-y-1">
            {discoveryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
                      : 'hover:bg-surface-800 hover:text-surface-100 text-surface-400'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent' : ''}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Library Section */}
        <div>
          {!collapsed && (
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
              Library
            </p>
          )}
          <div className="space-y-1">
            {userItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
                      : 'hover:bg-surface-800 hover:text-surface-100 text-surface-400'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent' : ''}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-surface-800 text-surface-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-surface-800/80 text-[10px] text-surface-500 text-center">
          <span>Public IPTV Streams</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block h-screen sticky top-0 transition-all duration-200 z-30 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 z-50 md:hidden transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
