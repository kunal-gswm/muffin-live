import type { SportType } from '../types';

export interface SportsClassification {
  sportType: SportType;
  isInferred: boolean;
  isSportsChannel: boolean;
  confidence: 'explicit' | 'keyword' | 'none';
}

const FOOTBALL_PATTERNS = [
  /\bfootball\b/i,
  /\bsoccer\b/i,
  /\bfifa\b/i,
  /\buefa\b/i,
  /\bchampions\s+league\b/i,
  /\beuropa\s+league\b/i,
  /\bpremier\s+league\b/i,
  /\blaliga\b/i,
  /\bserie\s+a\b/i,
  /\bbundesliga\b/i,
  /\bligue\s*1\b/i,
  /\bmls\b/i,
  /\bmutv\b/i,
  /\breal\s+madrid\b/i,
  /\bbarca\b/i,
  /\bbar\u00e7a\b/i,
  /\bchelsea\s*tv\b/i,
  /\barsenal\s*tv\b/i,
  /\bliverpool\s*tv\b/i,
  /\bcalcio\b/i,
  /\bfutebol\b/i,
  /\bfutbol\b/i,
  /\bf\u00fatbol\b/i,
  /\beredivisie\b/i,
  /\bceltic\s*tv\b/i,
  /\brangers\s*tv\b/i,
];

const CRICKET_PATTERNS = [
  /\bcricket\b/i,
  /\bipl\b/i,
  /\bwillow\b/i,
  /\bbcci\b/i,
  /\bicc\b/i,
  /\bcricbuzz\b/i,
  /\bt20\b/i,
  /\bashes\b/i,
];

const TENNIS_PATTERNS = [
  /\btennis\b/i,
  /\batp\b/i,
  /\bwta\b/i,
  /\bwimbledon\b/i,
  /\broland\s*garros\b/i,
  /\bus\s+open\s+tennis\b/i,
  /\baustralian\s+open\b/i,
  /\bsupertennis\b/i,
];

const BASKETBALL_PATTERNS = [
  /\bbasketball\b/i,
  /\bnba\b/i,
  /\bwnba\b/i,
  /\beuroleague\b/i,
  /\bfiba\b/i,
  /\bhoops\b/i,
  /\bbaloncesto\b/i,
  /\bpallacanestro\b/i,
];

const MOTORSPORT_PATTERNS = [
  /\bmotorsport\b/i,
  /\bmotor\s*sport\b/i,
  /\bracing\b/i,
  /\bformula\s*1\b/i,
  /\bformula1\b/i,
  /\bf1\b/i,
  /\bf2\b/i,
  /\bmotogp\b/i,
  /\bmoto\s*gp\b/i,
  /\bnascar\b/i,
  /\bindycar\b/i,
  /\bwrc\b/i,
  /\bsupercars\b/i,
  /\bauto\s*motor\b/i,
  /\bkarting\b/i,
  /\bspeedway\b/i,
  /\brally\b/i,
];

const OTHER_SPORTS_PATTERNS = [
  /\bgolf\b/i,
  /\bhockey\b/i,
  /\bnhl\b/i,
  /\bbaseball\b/i,
  /\bmlb\b/i,
  /\bmma\b/i,
  /\bufc\b/i,
  /\bboxing\b/i,
  /\bfight\b/i,
  /\bwrestling\b/i,
  /\bwwe\b/i,
  /\bolympic\b/i,
  /\bathletics\b/i,
  /\bvolleyball\b/i,
  /\bbadminton\b/i,
  /\brugby\b/i,
  /\bdarts\b/i,
  /\bsnooker\b/i,
  /\bbilliards\b/i,
  /\bcycling\b/i,
  /\bswim(?:ming)?\b/i,
  /\bski(?:ing)?\b/i,
  /\bsnowboard\b/i,
  /\bextreme\s+sports\b/i,
  /\bred\s*bull\s*tv\b/i,
  /\bsurf(?:ing)?\b/i,
  /\bequestrian\b/i,
  /\bhandball\b/i,
  /\btable\s*tennis\b/i,
];

const GENERAL_SPORTS_KEYWORDS = [
  /\bsport/i,
  /\bespn/i,
  /\beurosport/i,
  /\bbein/i,
  /\bsky\s*sport/i,
  /\btsn/i,
  /\bsupersport/i,
  /\barena\s*sport/i,
  /\bfox\s*sport/i,
  /\bdazn/i,
  /\bstar\s*sports/i,
  /\bsony\s*(?:ten|sports)/i,
  /\bsportsnet/i,
  /\bpolsat\s*sport/i,
  /\bsport\s*tv/i,
  /\b\u010dt\s*sport/i,
  /\bert\s*sports/i,
  /\bsptv/i,
];

/**
 * Classifies a channel into a sport subcategory based on reliable name keywords or group metadata.
 * Transparently marks whether the categorization was inferred.
 */
export function classifyChannelSport(
  channelName: string,
  group = '',
  tvgId = ''
): SportsClassification {
  const combined = `${channelName} ${group} ${tvgId}`;

  // 1. Check Football
  if (FOOTBALL_PATTERNS.some((pattern) => pattern.test(combined))) {
    return {
      sportType: 'football',
      isInferred: true,
      isSportsChannel: true,
      confidence: 'keyword',
    };
  }

  // 2. Check Cricket
  if (CRICKET_PATTERNS.some((pattern) => pattern.test(combined))) {
    return {
      sportType: 'cricket',
      isInferred: true,
      isSportsChannel: true,
      confidence: 'keyword',
    };
  }

  // 3. Check Tennis
  if (TENNIS_PATTERNS.some((pattern) => pattern.test(combined))) {
    return {
      sportType: 'tennis',
      isInferred: true,
      isSportsChannel: true,
      confidence: 'keyword',
    };
  }

  // 4. Check Basketball
  if (BASKETBALL_PATTERNS.some((pattern) => pattern.test(combined))) {
    return {
      sportType: 'basketball',
      isInferred: true,
      isSportsChannel: true,
      confidence: 'keyword',
    };
  }

  // 5. Check Motorsport
  if (MOTORSPORT_PATTERNS.some((pattern) => pattern.test(combined))) {
    return {
      sportType: 'motorsport',
      isInferred: true,
      isSportsChannel: true,
      confidence: 'keyword',
    };
  }

  // 6. Check Other specific sports
  if (OTHER_SPORTS_PATTERNS.some((pattern) => pattern.test(combined))) {
    return {
      sportType: 'other',
      isInferred: true,
      isSportsChannel: true,
      confidence: 'keyword',
    };
  }

  // 7. Check if it's general sports (ESPN, Eurosport, Sky Sports, etc.)
  const isGroupSports = /sport/i.test(group);
  const matchesGeneral = GENERAL_SPORTS_KEYWORDS.some((pattern) => pattern.test(combined));

  if (isGroupSports || matchesGeneral) {
    return {
      sportType: 'other',
      isInferred: !isGroupSports,
      isSportsChannel: true,
      confidence: isGroupSports ? 'explicit' : 'keyword',
    };
  }

  return {
    sportType: 'all',
    isInferred: false,
    isSportsChannel: false,
    confidence: 'none',
  };
}
