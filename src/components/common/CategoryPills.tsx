import React from 'react';
import {
  Sparkles,
  Newspaper,
  Trophy,
  Film,
  Clapperboard,
  Music,
  BookOpen,
  Baby,
  Bookmark,
} from 'lucide-react';

export interface CategoryPillItem {
  id: string;
  label: string;
  icon?: React.FC<{ className?: string }>;
}

export const POPULAR_CATEGORIES: CategoryPillItem[] = [
  { id: 'all', label: 'All Channels', icon: Sparkles },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Entertainment', icon: Film },
  { id: 'movies', label: 'Movies', icon: Clapperboard },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'documentary', label: 'Documentary', icon: BookOpen },
  { id: 'kids', label: 'Kids & Family', icon: Baby },
  { id: 'favorites', label: 'Favorites', icon: Bookmark },
];

interface CategoryPillsProps {
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  activeId,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto no-scrollbar py-2 -mx-1 px-1 flex items-center gap-2 ${className}`}>
      {POPULAR_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeId.toLowerCase() === cat.id.toLowerCase();

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 select-none ${
              isActive
                ? 'bg-accent text-surface-950 font-semibold shadow-sm'
                : 'bg-surface-900 hover:bg-surface-850 text-surface-300 hover:text-white border border-surface-750 hover:border-surface-700'
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-surface-950' : 'text-surface-400'}`} />}
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
