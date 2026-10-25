import React, { useState } from 'react';
import type { Channel } from '../types';
import { Languages, Search, ArrowRight } from 'lucide-react';

interface LanguagesPageProps {
  channels: Channel[];
  onSelectLanguage: (language: string) => void;
}

export const LanguagesPage: React.FC<LanguagesPageProps> = ({
  channels,
  onSelectLanguage,
}) => {
  const [query, setQuery] = useState('');

  // Group channels by language
  const languageCounts = channels.reduce<Record<string, number>>((acc, ch) => {
    if (ch.language) {
      acc[ch.language] = (acc[ch.language] || 0) + 1;
    }
    return acc;
  }, {});

  const languages = Object.keys(languageCounts).sort((a, b) => a.localeCompare(b));
  const filtered = languages.filter((l) =>
    l.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-white tracking-tight">Browse by Language</h2>
          <span className="text-xs text-surface-400">({languages.length} languages)</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-surface-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search language..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-900 border border-surface-750 rounded-lg text-surface-100 placeholder-surface-500 outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map((lang) => (
          <button
            key={lang}
            onClick={() => onSelectLanguage(lang)}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-900 border border-surface-800 hover:border-surface-700 hover:bg-surface-850 transition-colors text-left group"
          >
            <div>
              <span className="text-xs font-semibold text-white group-hover:text-accent transition-colors">
                {lang}
              </span>
              <p className="text-[11px] text-surface-400 mt-0.5">
                {languageCounts[lang]} {languageCounts[lang] === 1 ? 'channel' : 'channels'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-surface-500 group-hover:text-accent transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
