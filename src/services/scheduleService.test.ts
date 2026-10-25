import { describe, it, expect } from 'vitest';
import { scheduleService, OFFICIAL_COMPETITIONS_DIRECTORY } from './scheduleService';

describe('scheduleService', () => {
  it('provides a curated directory of official competitions and broadcasters', () => {
    const list = scheduleService.getCompetitions('all');
    expect(list.length).toBeGreaterThan(0);
    expect(list).toEqual(OFFICIAL_COMPETITIONS_DIRECTORY);

    // Ensure all items link to legitimate official HTTPS endpoints
    for (const item of list) {
      expect(item.officialScheduleUrl).toMatch(/^https:\/\//);
      expect(item.verifiedBroadcasters.length).toBeGreaterThan(0);
      for (const b of item.verifiedBroadcasters) {
        expect(b.officialUrl).toMatch(/^https:\/\//);
        expect(b.broadcaster.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('filters competitions by sport subcategory correctly', () => {
    const motorsport = scheduleService.getCompetitions('motorsport');
    expect(motorsport.every((c) => c.sport === 'motorsport')).toBe(true);
    expect(motorsport.some((c) => c.competition.includes('Formula 1'))).toBe(true);

    const football = scheduleService.getCompetitions('football');
    expect(football.every((c) => c.sport === 'football')).toBe(true);
    expect(football.some((c) => c.competition.includes('Premier League'))).toBe(true);
  });
});
