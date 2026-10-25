import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search channels by name, country, language...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-surface-400 absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-xs md:text-sm bg-surface-900 border border-surface-750 focus:border-accent text-surface-100 placeholder-surface-500 rounded-lg outline-none transition-colors focus:ring-1 focus:ring-accent"
        aria-label="Search channels"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="p-1 rounded-full text-surface-400 hover:text-white absolute right-2.5 hover:bg-surface-800 transition-colors"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
