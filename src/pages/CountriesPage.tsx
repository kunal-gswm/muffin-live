import React, { useState } from 'react';
import type { Channel } from '../types';
import { Globe, Search, ArrowRight } from 'lucide-react';

interface CountriesPageProps {
  channels: Channel[];
  onSelectCountry: (country: string) => void;
}

export const CountriesPage: React.FC<CountriesPageProps> = ({
  channels,
  onSelectCountry,
}) => {
  const [query, setQuery] = useState('');

  // Group channels by country code
  const countryCounts = channels.reduce<Record<string, number>>((acc, ch) => {
    if (ch.country) {
      acc[ch.country] = (acc[ch.country] || 0) + 1;
    }
    return acc;
  }, {});

  const countries = Object.keys(countryCounts).sort((a, b) => a.localeCompare(b));
  const filtered = countries.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-white tracking-tight">Browse by Country</h2>
          <span className="text-xs text-surface-400">({countries.length} countries)</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-surface-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country code..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-900 border border-surface-750 rounded-lg text-surface-100 placeholder-surface-500 outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map((country) => (
          <button
            key={country}
            onClick={() => onSelectCountry(country)}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-900 border border-surface-800 hover:border-surface-700 hover:bg-surface-850 transition-colors text-left group"
          >
            <div>
              <span className="text-sm font-bold font-mono text-white group-hover:text-accent transition-colors">
                {country}
              </span>
              <p className="text-[11px] text-surface-400 mt-0.5">
                {countryCounts[country]} {countryCounts[country] === 1 ? 'channel' : 'channels'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-surface-500 group-hover:text-accent transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
