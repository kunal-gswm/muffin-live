import type { MatchFixture, SportType } from '../types';

export const OFFICIAL_SPORTS_FIXTURES: MatchFixture[] = [
  {
    id: 'f1-2026-gp-round',
    sport: 'motorsport',
    competition: 'Formula 1 World Championship',
    homeTeam: 'Grand Prix Weekend',
    awayTeam: 'Qualifying & Main Race',
    startTime: '2026-11-01T14:00:00Z',
    status: 'upcoming',
    officialBroadcasters: [
      { region: 'United States', broadcaster: 'ESPN / ABC', officialUrl: 'https://www.espn.com/f1/' },
      { region: 'United Kingdom', broadcaster: 'Sky Sports F1', officialUrl: 'https://www.skysports.com/f1' },
      { region: 'Global OTT', broadcaster: 'F1 TV Official', officialUrl: 'https://f1tv.formula1.com' },
      { region: 'Austria / Free', broadcaster: 'ServusTV / ORF', officialUrl: 'https://www.servustv.com/sport/' },
    ],
  },
  {
    id: 'uefa-cl-matchday',
    sport: 'football',
    competition: 'UEFA Champions League',
    homeTeam: 'European Matchday',
    awayTeam: 'League Phase Clash',
    startTime: '2026-11-04T20:00:00Z',
    status: 'upcoming',
    officialBroadcasters: [
      { region: 'United States', broadcaster: 'Paramount+ / CBS', officialUrl: 'https://www.paramountplus.com' },
      { region: 'United Kingdom', broadcaster: 'TNT Sports / Discovery+', officialUrl: 'https://www.tntsports.co.uk' },
      { region: 'India & South Asia', broadcaster: 'Sony LIV', officialUrl: 'https://www.sonyliv.com' },
      { region: 'Spain', broadcaster: 'Movistar+ Liga de Campeones', officialUrl: 'https://www.movistarplus.es' },
    ],
  },
  {
    id: 'premier-league-weekend',
    sport: 'football',
    competition: 'English Premier League',
    homeTeam: 'Premier League Matchday',
    awayTeam: 'Weekend Live Action',
    startTime: '2026-10-31T15:00:00Z',
    status: 'upcoming',
    officialBroadcasters: [
      { region: 'United Kingdom', broadcaster: 'Sky Sports / TNT Sports', officialUrl: 'https://www.skysports.com/football' },
      { region: 'United States', broadcaster: 'NBC Sports / Peacock', officialUrl: 'https://www.peacocktv.com/sports' },
      { region: 'India', broadcaster: 'Disney+ Hotstar', officialUrl: 'https://www.hotstar.com' },
    ],
  },
  {
    id: 'icc-cricket-championship',
    sport: 'cricket',
    competition: 'ICC World Championship',
    homeTeam: 'International Test Series',
    awayTeam: 'Day 1 Session',
    startTime: '2026-11-06T04:30:00Z',
    status: 'upcoming',
    officialBroadcasters: [
      { region: 'India', broadcaster: 'Star Sports / JioCinema', officialUrl: 'https://www.jiocinema.com/sports' },
      { region: 'United Kingdom', broadcaster: 'Sky Sports Cricket', officialUrl: 'https://www.skysports.com/cricket' },
      { region: 'Australia', broadcaster: 'Fox Sports / Kayo', officialUrl: 'https://kayosports.com.au' },
      { region: 'North America', broadcaster: 'Willow TV', officialUrl: 'https://www.willow.tv' },
    ],
  },
  {
    id: 'nba-regular-season',
    sport: 'basketball',
    competition: 'NBA Regular Season',
    homeTeam: 'NBA Prime Time Game',
    awayTeam: 'National Broadcast',
    startTime: '2026-10-29T00:30:00Z',
    status: 'upcoming',
    officialBroadcasters: [
      { region: 'United States', broadcaster: 'ESPN / TNT / NBA TV', officialUrl: 'https://www.nba.com/watch' },
      { region: 'Global OTT', broadcaster: 'NBA League Pass', officialUrl: 'https://www.nba.com/leaguepass' },
    ],
  },
  {
    id: 'atp-wta-masters',
    sport: 'tennis',
    competition: 'ATP Masters 1000',
    homeTeam: 'Round of 16 / Quarterfinals',
    awayTeam: 'Center Court',
    startTime: '2026-11-02T10:00:00Z',
    status: 'upcoming',
    officialBroadcasters: [
      { region: 'United States', broadcaster: 'Tennis Channel', officialUrl: 'https://tennischannel.com' },
      { region: 'United Kingdom', broadcaster: 'Sky Sports Tennis', officialUrl: 'https://www.skysports.com/tennis' },
      { region: 'Italy / Free-to-Air', broadcaster: 'SuperTennis HD', officialUrl: 'https://www.supertennis.tv' },
    ],
  },
  {
    id: 'red-bull-rampage',
    sport: 'other',
    competition: 'Extreme Sports Invitational',
    homeTeam: 'Red Bull Outdoor Series',
    awayTeam: 'Finals Showcase',
    startTime: '2026-10-30T17:00:00Z',
    status: 'upcoming',
    officialBroadcasters: [
      { region: 'Global Free-to-Air', broadcaster: 'Red Bull TV Official', officialUrl: 'https://www.redbull.com/tv/' },
    ],
  },
];

export const scheduleService = {
  getFixtures(sportFilter: SportType = 'all'): MatchFixture[] {
    if (sportFilter === 'all') {
      return OFFICIAL_SPORTS_FIXTURES;
    }
    return OFFICIAL_SPORTS_FIXTURES.filter((f) => f.sport === sportFilter);
  },
};
