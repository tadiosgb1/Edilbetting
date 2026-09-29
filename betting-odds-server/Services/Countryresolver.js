'use strict';

// The Odds API /sports response has NO country field — only key, group,
// title, description, active, has_outrights. `group` is the sport CATEGORY
// ("Soccer"), not a country. This map bridges that gap.
const LEAGUE_COUNTRY_MAP = {
  // England
  soccer_epl:                  'England',
  soccer_efl_champ:            'England',
  soccer_england_league1:      'England',
  soccer_england_league2:      'England',
  soccer_fa_cup:               'England',
  soccer_england_efl_cup:      'England',
  // Scotland
  soccer_spl:                  'Scotland',
  soccer_scotland_championship:'Scotland',
  // Europe — club competitions
  soccer_spain_la_liga:         'Spain',
  soccer_germany_bundesliga:    'Germany',
  soccer_germany_bundesliga2:   'Germany',
  soccer_italy_serie_a:         'Italy',
  soccer_italy_serie_b:         'Italy',
  soccer_france_ligue_one:      'France',
  soccer_france_ligue_two:      'France',
  soccer_netherlands_eredivisie:'Netherlands',
  soccer_portugal_primeira_liga:'Portugal',
  soccer_belgium_first_div:     'Belgium',
  soccer_turkey_super_league:   'Turkey',
  soccer_greece_super_league:   'Greece',
  soccer_switzerland_superleague:'Switzerland',
  soccer_austria_bundesliga:    'Austria',
  soccer_denmark_superliga:     'Denmark',
  soccer_sweden_allsvenskan:    'Sweden',
  soccer_sweden_superettan:     'Sweden',
  soccer_norway_eliteserien:    'Norway',
  soccer_poland_ekstraklasa:    'Poland',
  // International / confederation
  soccer_uefa_champs_league:               'International',
  soccer_uefa_europa_league:               'International',
  soccer_uefa_europa_conference_league:    'International',
  soccer_uefa_champs_league_qualification: 'International',
  soccer_fifa_world_cup:                   'International',
  soccer_fifa_world_cup_winner:            'International',
  soccer_uefa_european_championship:       'International',
  soccer_uefa_nations_league:              'International',
  soccer_conmebol_copa_libertadores:       'International',
  soccer_africa_cup_of_nations:            'International',
  // Americas
  soccer_brazil_campeonato:        'Brazil',
  soccer_argentina_primera_division:'Argentina',
  soccer_mexico_ligamx:            'Mexico',
  soccer_usa_mls:                  'USA',
  // Asia / Oceania
  soccer_saudi_arabia_pro_league: 'Saudi Arabia',
  soccer_korea_kleague1:          'South Korea',
  soccer_japan_j_league:          'Japan',
  soccer_china_superleague:       'China',
  soccer_australia_aleague:       'Australia',
  // US sports
  basketball_nba:         'USA',
  basketball_wnba:        'USA',
  basketball_ncaab:       'USA',
  americanfootball_nfl:   'USA',
  americanfootball_ncaaf: 'USA',
  baseball_mlb:           'USA',
  icehockey_nhl:          'USA/Canada',
};

/**
 * Resolve a sport_key to a country name.
 *  1. Exact match in the map above.
 *  2. Pattern fallback: soccer_{country}_{league} → capitalised country.
 *  3. Last resort: 'Other'.
 */
function resolveCountry(sportKey) {
  if (LEAGUE_COUNTRY_MAP[sportKey]) return LEAGUE_COUNTRY_MAP[sportKey];

  const m = sportKey.match(/^soccer_([a-z]+)_/);
  if (m) {
    const raw = m[1];
    const nonCountry = new Set(['uefa', 'fifa', 'conmebol', 'concacaf', 'caf', 'afc']);
    if (!nonCountry.has(raw)) {
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return 'International';
  }
  return 'Other';
}

module.exports = { resolveCountry, LEAGUE_COUNTRY_MAP };
