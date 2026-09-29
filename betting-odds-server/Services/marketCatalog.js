'use strict';

// Only these 6 keys work on the bulk /sports/{sport}/odds endpoint.
const FEATURED_MARKETS = new Set([
  'h2h', 'spreads', 'totals', 'outrights', 'h2h_lay', 'outrights_lay',
]);

const MARKET_CATALOG = {
  featured: [...FEATURED_MARKETS],

  additional: [
    'alternate_spreads', 'alternate_totals', 'btts', 'draw_no_bet',
    'h2h_3_way', 'team_totals', 'alternate_team_totals',
  ],

  // Period/half/quarter variants built programmatically from base keys.
  gamePeriod: (() => {
    const bases   = ['h2h', 'h2h_3_way', 'spreads', 'alternate_spreads', 'totals', 'alternate_totals', 'team_totals'];
    const periods = ['q1', 'q2', 'q3', 'q4', 'h1', 'h2', 'p1', 'p2', 'p3',
                     '1st_1_innings', '1st_3_innings', '1st_5_innings', '1st_7_innings'];
    const keys = [];
    bases.forEach(b => periods.forEach(s => keys.push(`${b}_${s}`)));
    keys.push('h2h_s1','h2h_s2','spreads_s1','alternate_set_spreads',
               'totals_s1','alternate_set_totals','alternate_totals_s1','alternate_totals_s2');
    return keys;
  })(),

  otherSoccer: [
    'alternate_spreads_corners', 'alternate_totals_corners', 'alternate_spreads_cards',
    'alternate_team_totals_corners', 'alternate_totals_cards',
    'btts_h1', 'correct_score', 'correct_score_h1',
    'corners_1x2', 'double_chance', 'double_chance_h1',
    'halftime_fulltime', 'to_qualify',
  ],

  playerPropsSoccer: [
    'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
    'player_to_receive_card', 'player_to_receive_red_card',
    'player_shots_on_target', 'player_shots', 'player_assists',
  ],
};

// Flat set for fast validation
const ALL_KNOWN_MARKETS = new Set([
  ...MARKET_CATALOG.featured,
  ...MARKET_CATALOG.additional,
  ...MARKET_CATALOG.gamePeriod,
  ...MARKET_CATALOG.otherSoccer,
  ...MARKET_CATALOG.playerPropsSoccer,
]);

/** Player props follow predictable prefixes — validate loosely rather than
 *  hardcoding ~170 keys. */
function isKnownMarket(key) {
  if (ALL_KNOWN_MARKETS.has(key)) return true;
  return /^(player_|batter_|pitcher_)/.test(key);
}

/** Sanitise a comma-separated markets string: drop anything unrecognised. */
function sanitiseMarkets(raw) {
  const fallback = process.env.DEFAULT_MARKETS || 'h2h';
  if (!raw) return fallback;
  const list = raw.split(',').map(m => m.trim()).filter(isKnownMarket);
  return list.length ? list.join(',') : fallback;
}

/** True only when every requested market is a bulk-endpoint-eligible key. */
function isBulkEligible(marketsCsv) {
  return (marketsCsv || '').split(',').every(m => FEATURED_MARKETS.has(m.trim()));
}

/**
 * Auto-select safe markets per sport to avoid INVALID_MARKET_COMBO errors.
 * Caller may still override via req.query.markets.
 */
function defaultMarketsForSport(sportKey) {
  const k = (sportKey || '').toLowerCase();
  if (k.startsWith('soccer') || k.startsWith('rugby') || k.startsWith('aussie')) {
    return 'h2h,totals';
  }
  if (k.startsWith('basketball') || k.startsWith('americanfootball') ||
      k.startsWith('baseball')   || k.startsWith('icehockey')) {
    return 'h2h,spreads,totals';
  }
  if (k.startsWith('golf') || k.startsWith('mma') || k.startsWith('boxing') ||
      k.startsWith('cricket') || k.startsWith('tennis')) {
    return 'h2h,outrights';
  }
  return 'h2h';
}

module.exports = {
  MARKET_CATALOG,
  FEATURED_MARKETS,
  ALL_KNOWN_MARKETS,
  isKnownMarket,
  sanitiseMarkets,
  isBulkEligible,
  defaultMarketsForSport,
};
