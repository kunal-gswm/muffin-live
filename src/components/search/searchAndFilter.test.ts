import { describe, it, expect } from 'vitest';
import type { Channel, FilterState } from '../../types';

const mockChannels: Channel[] = [
  {
    id: 'bbc-news-1',
    name: 'BBC News',
    url: 'https://example.com/bbc.m3u8',
    logo: 'https://example.com/bbc.png',
    group: 'News',
    country: 'UK',
    language: 'English',
    tvgId: 'BBCNews.uk',
  },
  {
    id: 'espn-sports-1',
    name: 'ESPN Sports',
    url: 'https://example.com/espn.m3u8',
    logo: 'https://example.com/espn.png',
    group: 'Sports',
    country: 'US',
    language: 'English',
    tvgId: 'ESPN.us',
  },
  {
    id: 'france24-fr-1',
    name: 'France 24',
    url: 'https://example.com/f24.m3u8',
    logo: null,
    group: 'News',
    country: 'FR',
    language: 'French',
    tvgId: 'France24.fr',
  },
  {
    id: 'anime-japan-1',
    name: 'Animax',
    url: 'https://example.com/animax.m3u8',
    logo: null,
    group: 'Animation',
    country: 'JP',
    language: 'Japanese',
    tvgId: 'Animax.jp',
  },
];

function filterChannels(channels: Channel[], filters: FilterState): Channel[] {
  let result = channels;

  if (filters.category !== 'all') {
    result = result.filter(
      (c) => c.group.toLowerCase() === filters.category.toLowerCase()
    );
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.country && c.country.toLowerCase().includes(q)) ||
        (c.language && c.language.toLowerCase().includes(q)) ||
        c.group.toLowerCase().includes(q)
    );
  }

  if (filters.country !== 'all') {
    result = result.filter(
      (c) => c.country?.toLowerCase() === filters.country.toLowerCase()
    );
  }

  if (filters.language !== 'all') {
    result = result.filter(
      (c) => c.language?.toLowerCase() === filters.language.toLowerCase()
    );
  }

  return [...result].sort((a, b) => {
    switch (filters.sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'country':
        return (a.country || '').localeCompare(b.country || '');
      case 'category':
        return a.group.localeCompare(b.group);
      default:
        return 0;
    }
  });
}

describe('Channel Filtering and Search', () => {
  const baseFilters: FilterState = {
    search: '',
    category: 'all',
    country: 'all',
    language: 'all',
    sortBy: 'name-asc',
    viewMode: 'grid',
    favoritesOnly: false,
    recentOnly: false,
  };

  it('filters channels by search query matching channel name', () => {
    const filtered = filterChannels(mockChannels, { ...baseFilters, search: 'BBC' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('BBC News');
  });

  it('filters channels by search query matching country code', () => {
    const filtered = filterChannels(mockChannels, { ...baseFilters, search: 'JP' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Animax');
  });

  it('filters channels by category', () => {
    const filtered = filterChannels(mockChannels, { ...baseFilters, category: 'News' });
    expect(filtered.length).toBe(2);
    expect(filtered.map((c) => c.name)).toContain('BBC News');
    expect(filtered.map((c) => c.name)).toContain('France 24');
  });

  it('filters channels by language', () => {
    const filtered = filterChannels(mockChannels, { ...baseFilters, language: 'French' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('France 24');
  });

  it('sorts channels alphabetically in ascending and descending order', () => {
    const asc = filterChannels(mockChannels, { ...baseFilters, sortBy: 'name-asc' });
    expect(asc[0].name).toBe('Animax');
    expect(asc[asc.length - 1].name).toBe('France 24');

    const desc = filterChannels(mockChannels, { ...baseFilters, sortBy: 'name-desc' });
    expect(desc[0].name).toBe('France 24');
    expect(desc[desc.length - 1].name).toBe('Animax');
  });

  it('returns empty array when no channels match', () => {
    const none = filterChannels(mockChannels, { ...baseFilters, search: 'NonExistent123' });
    expect(none.length).toBe(0);
  });
});
