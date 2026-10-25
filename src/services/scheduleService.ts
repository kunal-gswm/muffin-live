import type { CompetitionDirectoryItem, SportType } from '../types';

export const OFFICIAL_COMPETITIONS_DIRECTORY: CompetitionDirectoryItem[] = [
  {
    id: 'f1-official',
    sport: 'motorsport',
    competition: 'Formula 1 World Championship',
    organizer: 'FIA / Formula One Group',
    officialScheduleUrl: 'https://www.formula1.com/en/racing/2026.html',
    description:
      'Official Grand Prix championship calendar, practice sessions, qualifying, and race schedules.',
    verifiedBroadcasters: [
      { region: 'Global OTT', broadcaster: 'F1 TV Pro', officialUrl: 'https://f1tv.formula1.com' },
      { region: 'United Kingdom', broadcaster: 'Sky Sports F1', officialUrl: 'https://www.skysports.com/f1' },
      { region: 'United States', broadcaster: 'ESPN / ABC', officialUrl: 'https://www.espn.com/f1/' },
      { region: 'Austria / Free', broadcaster: 'ServusTV / ORF', officialUrl: 'https://www.servustv.com/sport/' },
    ],
  },
  {
    id: 'premier-league-official',
    sport: 'football',
    competition: 'English Premier League',
    organizer: 'The Football Association Premier League',
    officialScheduleUrl: 'https://www.premierleague.com/fixtures',
    description:
      'Official 38-gameweek season fixture schedule with match dates, kick-off times, and broadcast rights.',
    verifiedBroadcasters: [
      { region: 'United Kingdom', broadcaster: 'Sky Sports / TNT Sports', officialUrl: 'https://www.skysports.com/football' },
      { region: 'United States', broadcaster: 'NBC Sports / Peacock', officialUrl: 'https://www.peacocktv.com/sports' },
      { region: 'India & Subcontinent', broadcaster: 'Disney+ Hotstar / Star Sports', officialUrl: 'https://www.hotstar.com' },
    ],
  },
  {
    id: 'uefa-cl-official',
    sport: 'football',
    competition: 'UEFA Champions League',
    organizer: 'Union of European Football Associations (UEFA)',
    officialScheduleUrl: 'https://www.uefa.com/uefachampionsleague/fixtures-results/',
    description:
      'Official tournament phase matchday calendar and official licensed broadcast partners.',
    verifiedBroadcasters: [
      { region: 'United Kingdom', broadcaster: 'TNT Sports', officialUrl: 'https://www.tntsports.co.uk' },
      { region: 'United States', broadcaster: 'Paramount+ / CBS Sports', officialUrl: 'https://www.paramountplus.com' },
      { region: 'South Asia', broadcaster: 'Sony LIV', officialUrl: 'https://www.sonyliv.com' },
    ],
  },
  {
    id: 'icc-cricket-official',
    sport: 'cricket',
    competition: 'ICC International Cricket Calendar',
    organizer: 'International Cricket Council (ICC)',
    officialScheduleUrl: 'https://www.icc-cricket.com/matches',
    description:
      'Official international Test, ODI, and T20 international tournament fixtures.',
    verifiedBroadcasters: [
      { region: 'India', broadcaster: 'JioCinema / Star Sports', officialUrl: 'https://www.jiocinema.com/sports' },
      { region: 'United Kingdom', broadcaster: 'Sky Sports Cricket', officialUrl: 'https://www.skysports.com/cricket' },
      { region: 'Australia', broadcaster: 'Fox Cricket / Kayo', officialUrl: 'https://kayosports.com.au' },
      { region: 'North America', broadcaster: 'Willow TV', officialUrl: 'https://www.willow.tv' },
    ],
  },
  {
    id: 'nba-official',
    sport: 'basketball',
    competition: 'National Basketball Association (NBA)',
    organizer: 'NBA Properties, Inc.',
    officialScheduleUrl: 'https://www.nba.com/schedule',
    description:
      'Official regular season and playoffs schedule with national and local broadcast listings.',
    verifiedBroadcasters: [
      { region: 'Global OTT', broadcaster: 'NBA League Pass', officialUrl: 'https://www.nba.com/leaguepass' },
      { region: 'United States', broadcaster: 'ESPN / ABC / TNT', officialUrl: 'https://www.nba.com/watch' },
    ],
  },
  {
    id: 'atp-tour-official',
    sport: 'tennis',
    competition: 'ATP & WTA Tour',
    organizer: 'Association of Tennis Professionals',
    officialScheduleUrl: 'https://www.atptour.com/en/tournaments',
    description:
      'Official Grand Slam, Masters 1000, and ATP 500/250 tournament calendar.',
    verifiedBroadcasters: [
      { region: 'United States', broadcaster: 'Tennis Channel', officialUrl: 'https://tennischannel.com' },
      { region: 'United Kingdom', broadcaster: 'Sky Sports Tennis', officialUrl: 'https://www.skysports.com/tennis' },
      { region: 'Italy / Free', broadcaster: 'SuperTennis HD', officialUrl: 'https://www.supertennis.tv' },
    ],
  },
  {
    id: 'red-bull-tv-live',
    sport: 'other',
    competition: 'Red Bull Extreme Sports & Live Events',
    organizer: 'Red Bull Media House',
    officialScheduleUrl: 'https://www.redbull.com/tv/live-events',
    description:
      'Official public live streaming schedule for mountain biking, motorsports, and extreme sports.',
    verifiedBroadcasters: [
      { region: 'Worldwide Free-to-Air', broadcaster: 'Red Bull TV Official', officialUrl: 'https://www.redbull.com/tv/' },
    ],
  },
  {
    id: 'fifa-plus-official',
    sport: 'football',
    competition: 'FIFA+ Match Center & Archives',
    organizer: 'Fédération Internationale de Football Association (FIFA)',
    officialScheduleUrl: 'https://www.plus.fifa.com',
    description:
      'Official free streaming portal for international youth tournaments and domestic leagues.',
    verifiedBroadcasters: [
      { region: 'Worldwide Free-to-Air', broadcaster: 'FIFA+ Official Portal', officialUrl: 'https://www.plus.fifa.com' },
    ],
  },
];

export const scheduleService = {
  getCompetitions(sportFilter: SportType = 'all'): CompetitionDirectoryItem[] {
    if (sportFilter === 'all') {
      return OFFICIAL_COMPETITIONS_DIRECTORY;
    }
    return OFFICIAL_COMPETITIONS_DIRECTORY.filter((c) => c.sport === sportFilter);
  },
};
