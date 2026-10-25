import React from 'react';
import {
  LayoutGrid,
  List,
  FilterX,
} from 'lucide-react';
import type { FilterState, SortOption, ViewMode } from '../../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  categories: string[];
  countries: string[];
  languages: string[];
  totalMatches: number;
  onResetFilters: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  categories,
  countries,
  languages,
  totalMatches,
  onResetFilters,
  className = '',
}) => {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.category !== 'all' ||
    filters.country !== 'all' ||
    filters.language !== 'all' ||
    filters.favoritesOnly ||
    filters.recentOnly;

  return (
    <div className={`flex flex-col gap-3 py-3 border-b border-surface-800 ${className}`}>
      {/* Primary Bar: Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-surface-900 border border-surface-750 hover:border-surface-700 text-surface-200 rounded-lg outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              aria-label="Filter by category"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Country Dropdown */}
          {countries.length > 0 && (
            <div className="relative">
              <select
                value={filters.country}
                onChange={(e) => onFilterChange({ country: e.target.value })}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-surface-900 border border-surface-750 hover:border-surface-700 text-surface-200 rounded-lg outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                aria-label="Filter by country"
              >
                <option value="all">All Countries ({countries.length})</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language Dropdown */}
          {languages.length > 0 && (
            <div className="relative hidden sm:block">
              <select
                value={filters.language}
                onChange={(e) => onFilterChange({ language: e.target.value })}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-surface-900 border border-surface-750 hover:border-surface-700 text-surface-200 rounded-lg outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                aria-label="Filter by language"
              >
                <option value="all">All Languages</option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-surface-900 border border-surface-750 hover:border-surface-700 text-surface-200 rounded-lg outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              aria-label="Sort channels"
            >
              <option value="name-asc">Sort: A to Z</option>
              <option value="name-desc">Sort: Z to A</option>
              <option value="country">Sort: Country</option>
              <option value="category">Sort: Category</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-surface-300 hover:text-white bg-surface-850 hover:bg-surface-800 border border-surface-700 rounded-lg transition-colors"
              title="Reset all active filters"
            >
              <FilterX className="w-3.5 h-3.5 text-red-400" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* View mode toggle & count badge */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-surface-400 font-mono">
            <span className="text-surface-100 font-semibold">{totalMatches}</span> channels
          </span>

          <div className="flex items-center bg-surface-900 border border-surface-750 rounded-lg p-0.5">
            <button
              onClick={() => onFilterChange({ viewMode: 'grid' as ViewMode })}
              className={`p-1.5 rounded transition-colors ${
                filters.viewMode === 'grid'
                  ? 'bg-surface-800 text-accent shadow-sm'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
              title="Grid View"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onFilterChange({ viewMode: 'list' as ViewMode })}
              className={`p-1.5 rounded transition-colors ${
                filters.viewMode === 'list'
                  ? 'bg-surface-800 text-accent shadow-sm'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
              title="List View"
              aria-label="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
