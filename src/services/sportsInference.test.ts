import { describe, it, expect } from 'vitest';
import { classifyChannelSport } from './sportsInference';

describe('sportsInference', () => {
  it('correctly classifies Football channels with explicit or keyword indicators', () => {
    const res1 = classifyChannelSport('MUTV Live', 'Sports');
    expect(res1.sportType).toBe('football');
    expect(res1.isSportsChannel).toBe(true);
    expect(res1.isInferred).toBe(true);

    const res2 = classifyChannelSport('Real Madrid TV (1080p)', 'Sports');
    expect(res2.sportType).toBe('football');
    expect(res2.isSportsChannel).toBe(true);

    const res3 = classifyChannelSport('UEFA Champions League TV', 'General');
    expect(res3.sportType).toBe('football');
    expect(res3.isSportsChannel).toBe(true);
  });

  it('correctly classifies Cricket channels', () => {
    const res = classifyChannelSport('Willow Cricket HD', 'Sports');
    expect(res.sportType).toBe('cricket');
    expect(res.isSportsChannel).toBe(true);
    expect(res.isInferred).toBe(true);

    const resT20 = classifyChannelSport('ICC T20 Live Stream', 'General');
    expect(resT20.sportType).toBe('cricket');
    expect(resT20.isSportsChannel).toBe(true);
  });

  it('correctly classifies Tennis channels', () => {
    const res = classifyChannelSport('Tennis Channel USA', 'Sports');
    expect(res.sportType).toBe('tennis');
    expect(res.isSportsChannel).toBe(true);

    const res2 = classifyChannelSport('SuperTennis HD', 'Italy');
    expect(res2.sportType).toBe('tennis');
    expect(res2.isSportsChannel).toBe(true);
  });

  it('correctly classifies Basketball channels', () => {
    const res = classifyChannelSport('NBA TV Live', 'Sports');
    expect(res.sportType).toBe('basketball');
    expect(res.isSportsChannel).toBe(true);

    const res2 = classifyChannelSport('Euroleague Basketball HD', 'Sports');
    expect(res2.sportType).toBe('basketball');
    expect(res2.isSportsChannel).toBe(true);
  });

  it('correctly classifies Motorsport channels', () => {
    const res = classifyChannelSport('Formula 1 Live Pit', 'Sports');
    expect(res.sportType).toBe('motorsport');
    expect(res.isSportsChannel).toBe(true);

    const res2 = classifyChannelSport('MotoGP World Feed', 'Sports');
    expect(res2.sportType).toBe('motorsport');
    expect(res2.isSportsChannel).toBe(true);

    const res3 = classifyChannelSport('Motorsport.tv Global', 'General');
    expect(res3.sportType).toBe('motorsport');
    expect(res3.isSportsChannel).toBe(true);
  });

  it('correctly classifies Other Sports channels', () => {
    const res = classifyChannelSport('30A Golf Kingdom', 'Sports');
    expect(res.sportType).toBe('other');
    expect(res.isSportsChannel).toBe(true);

    const res2 = classifyChannelSport('Red Bull TV', 'Extreme Sports');
    expect(res2.sportType).toBe('other');
    expect(res2.isSportsChannel).toBe(true);
  });

  it('handles general sports networks cleanly', () => {
    const res = classifyChannelSport('Eurosport 1', 'Sports');
    expect(res.isSportsChannel).toBe(true);
    expect(res.sportType).toBe('other');

    const resSky = classifyChannelSport('Sky Sports Main Event', 'General');
    expect(resSky.isSportsChannel).toBe(true);
  });

  it('marks non-sports channels as not sports', () => {
    const res = classifyChannelSport('BBC News 24', 'News');
    expect(res.isSportsChannel).toBe(false);
    expect(res.sportType).toBe('all');
    expect(res.confidence).toBe('none');
  });
});
