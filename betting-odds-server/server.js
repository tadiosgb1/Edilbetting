/**
 * Edilbetting — Odds API Proxy Server (v2)
 * Wraps https://api.the-odds-api.com/v4 and exposes clean REST endpoints
 * to the Vue front-end. All API calls are proxied here so the key stays
 * server-side and quota usage is centralised.
 *
 * WHAT'S NEW IN v2 (vs your previous server.js):
 *   1. MARKET_CATALOG — every market key from the Postman collection, grouped
 *      by category, replacing the old 6-key VALID_MARKETS whitelist.
 *   2. Auto-routing — a request is sent to the bulk /odds endpoint ONLY if
 *      every market requested is a truly-featured key; otherwise it's sent
 *      to the per-event endpoint automatically. You no longer have to know
 *      which endpoint a market belongs to.
 *   3. BOOKMAKER_PRIORITY + pickBestBookmaker() — implements the
 *      "Pinnacle first, then fallback" strategy: for each market, walk the
 *      priority list and return the first bookmaker that actually has data.
 *   4. A tiny in-memory TTL cache — so ten thousand front-end page loads
 *      don't turn into ten thousand upstream calls. Swap this for Redis in
 *      production; the interface (get/set) stays the same.
 *   5. GET /api/odds/:sportKey/events/:eventId/best — returns ONE clean
 *      price per market (your reference price, with an optional margin
 *      applied) instead of the raw 20-bookmaker blob.
 *
 * Start: node server.js  (or: nodemon server.js)
 * Base : http://localhost:3000/api
 */

import express  from 'express';
import cors     from 'cors';
import dotenv   from 'dotenv';
import axios    from 'axios';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── External API config (from .env) ────────────────────────────────────────
const ODDS_API_KEY     = process.env.ODDS_API_KEY     || '';
const ODDS_API_BASE    = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';
const DEFAULT_REGIONS  = process.env.DEFAULT_REGIONS  || 'eu';
const DEFAULT_MARKETS  = process.env.DEFAULT_MARKETS  || 'h2h';
const DEFAULT_ODDS_FMT = process.env.DEFAULT_ODDS_FORMAT || 'decimal';
const DEFAULT_MARGIN   = parseFloat(process.env.DEFAULT_MARGIN_PCT || '6'); // 6% house margin

// ═══════════════════════════════════════════════════════════════════════════
// MARKET CATALOG — every key from the doc, grouped by category.
// This REPLACES the old single VALID_MARKETS Set. Two things live here:
//   - which markets exist (so we can reject typos / unsupported keys)
//   - which markets are "featured" (bulk-endpoint-eligible) vs everything
//     else (per-event-endpoint-only)
// ═══════════════════════════════════════════════════════════════════════════

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

  // Half/quarter/period/inning/set variants — built once, programmatically,
  // since they follow a strict naming pattern (base + suffix).
  gamePeriod: (() => {
    const bases   = ['h2h', 'h2h_3_way', 'spreads', 'alternate_spreads', 'totals', 'alternate_totals', 'team_totals', 'alternate_team_totals'];
    const halvesQ = ['q1', 'q2', 'q3', 'q4', 'h1', 'h2'];
    const periods = ['p1', 'p2', 'p3'];
    const innings = ['1st_1_innings', '1st_3_innings', '1st_5_innings', '1st_7_innings'];
    const keys = [];
    bases.forEach(b => {
      halvesQ.forEach(s => keys.push(`${b}_${s}`));
      periods.forEach(s => keys.push(`${b}_${s}`));
      innings.forEach(s => keys.push(`${b}_${s}`));
    });
    keys.push(
      'h2h_s1', 'h2h_s2', 'spreads_s1', 'alternate_set_spreads',
      'totals_s1', 'alternate_set_totals', 'alternate_totals_s1', 'alternate_totals_s2'
    );
    return keys;
  })(),

  otherSoccer: [
    'alternate_spreads_corners', 'alternate_totals_corners', 'alternate_spreads_cards',
    'alternate_team_totals_corners', 'alternate_totals_cards', 'btts_h1', 'correct_score',
    'correct_score_h1', 'corners_1x2', 'double_chance', 'double_chance_h1',
    'halftime_fulltime', 'to_qualify',
  ],

  playerPropsSoccer: [
    'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
    'player_to_receive_card', 'player_to_receive_red_card', 'player_shots_on_target',
    'player_shots', 'player_assists',
  ],

  // Non-soccer player props kept for completeness (NFL/NBA/MLB/NHL/AFL/NRL).
  // Not exhaustively listed here — validated loosely, see isKnownMarket().
};

// Flat set of every explicitly-known key, for fast validation.
const ALL_KNOWN_MARKETS = new Set([
  ...MARKET_CATALOG.featured,
  ...MARKET_CATALOG.additional,
  ...MARKET_CATALOG.gamePeriod,
  ...MARKET_CATALOG.otherSoccer,
  ...MARKET_CATALOG.playerPropsSoccer,
]);

/** Player props (NFL/NBA/MLB/NHL/AFL/NRL) follow predictable prefixes.
 *  Rather than hardcode ~170 more keys, treat any player_*/batter_*/pitcher_*

function isKnownMarket(key) {
  if (ALL_KNOWN_MARKETS.has(key)) return true;
  return /^(player_|batter_|pitcher_)/.test(key);
}

/** Sanitise a comma-separated markets string: drop anything not recognised. */
function sanitiseMarkets(raw = DEFAULT_MARKETS) {
  const list = raw.split(',').map(m => m.trim()).filter(isKnownMarket);
  return list.length ? list.join(',') : DEFAULT_MARKETS;
}

/** A request can only use the bulk endpoint if EVERY requested market is
 *  a featured key. Mixing e.g. h2h + btts must go to the per-event endpoint. */
function isBulkEligible(marketsCsv) {
  return marketsCsv.split(',').every(m => FEATURED_MARKETS.has(m.trim()));
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOKMAKER PRIORITY — the fallback chain discussed earlier.
// For each league, list bookmakers in order of trust. pickBestBookmaker()
// walks this list per market and returns the first one that has data.
// Pinnacle first (sharpest/lowest-margin book), then broad-coverage backups.
// ═══════════════════════════════════════════════════════════════════════════
const BOOKMAKER_PRIORITY = {
  default:               ['pinnacle', 'williamhill', 'onexbet', 'betfair_ex_eu'],
  soccer_epl:            ['pinnacle', 'williamhill', 'onexbet', 'betfair_ex_eu'],
  soccer_spain_la_liga:  ['pinnacle', 'williamhill', 'onexbet'],
  soccer_germany_bundesliga: ['pinnacle', 'williamhill', 'onexbet'],
  soccer_italy_serie_a:  ['pinnacle', 'williamhill', 'onexbet'],
  soccer_france_ligue_one: ['pinnacle', 'williamhill', 'onexbet'],
};

function getBookmakerPriority(sportKey) {
  return BOOKMAKER_PRIORITY[sportKey] || BOOKMAKER_PRIORITY.default;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEAGUE → COUNTRY MAP
// The Odds API's /sports response has NO country field — only key, group,
// title, description, active, has_outrights. `group` is the SPORT CATEGORY
// ("Soccer", "Basketball"), not a country — that's why the old countries
// endpoint returned everything bucketed under one "Soccer" group instead of
// England/Spain/Italy/etc. There is no way to get country from the API
// itself, so we maintain this map ourselves. Extend it as you add leagues.
// Two-step resolution for any sport_key:
//   1. exact match in LEAGUE_COUNTRY_MAP (needed for keys with no country
//      in the name at all, e.g. soccer_epl → England)
//   2. fallback: parse soccer_{country}_{league} pattern from the key itself
//   3. last resort: "International" / "Unknown"
// ═══════════════════════════════════════════════════════════════════════════
const LEAGUE_COUNTRY_MAP = {
  // England — none of these include "england" in the key, so they MUST be
  // in the manual map; pattern-matching would miss all of them.
  soccer_epl:                 'England',
  soccer_efl_champ:           'England',
  soccer_england_league1:     'England',
  soccer_england_league2:     'England',
  soccer_fa_cup:               'England',
  soccer_england_efl_cup:      'England',

  // Scotland
  soccer_spl:                  'Scotland',
  soccer_scotland_championship:'Scotland',

  // International / confederation competitions — not tied to one country
  soccer_uefa_champs_league:   'International',
  soccer_uefa_europa_league:   'International',
  soccer_uefa_europa_conference_league: 'International',
  soccer_uefa_champs_league_qualification: 'International',
  soccer_fifa_world_cup:       'International',
  soccer_fifa_world_cup_winner:'International',
  soccer_uefa_european_championship: 'International',
  soccer_uefa_nations_league:  'International',
  soccer_conmebol_copa_libertadores: 'International',
  soccer_africa_cup_of_nations:'International',

  // US sports
  basketball_nba:              'USA',
  basketball_wnba:              'USA',
  basketball_ncaab:            'USA',
  americanfootball_nfl:        'USA',
  americanfootball_ncaaf:      'USA',
  baseball_mlb:                'USA',
  icehockey_nhl:                'USA/Canada',

  // Other notable ones referenced earlier in this project
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
  soccer_saudi_arabia_pro_league:'Saudi Arabia',
  soccer_korea_kleague1:        'South Korea',
  soccer_japan_j_league:        'Japan',
  soccer_china_superleague:     'China',
  soccer_brazil_campeonato:     'Brazil',
  soccer_argentina_primera_division: 'Argentina',
  soccer_mexico_ligamx:         'Mexico',
  soccer_usa_mls:               'USA',
  soccer_australia_aleague:     'Australia',
};

/** Resolve a sport_key to a country. Tries the manual map first, then a
 *  soccer_{country}_{league} pattern parse, then falls back to 'Other'. */
function resolveCountry(sportKey) {
  if (LEAGUE_COUNTRY_MAP[sportKey]) return LEAGUE_COUNTRY_MAP[sportKey];

  // Pattern fallback: soccer_germany_bundesliga2 -> "Germany"
  const m = sportKey.match(/^soccer_([a-z]+)_/);
  if (m) {
    const raw = m[1];
    // Skip tokens that are clearly not countries (uefa, fifa, conmebol...)
    const nonCountryTokens = new Set(['uefa', 'fifa', 'conmebol', 'concacaf', 'caf', 'afc']);
    if (!nonCountryTokens.has(raw)) {
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return 'International';
  }
  return 'Other';
}

/** Apply a house margin to a decimal price. Simple flat-percentage version —
 *  good enough to start; a proper implementation redistributes margin across
 *  outcomes so implied probabilities still sum sensibly. Revisit before you
 *  scale volume. */
function applyMargin(price, marginPct = DEFAULT_MARGIN) {
  const shaded = price * (1 - marginPct / 100);
  return Math.round(shaded * 100) / 100;
}

/** For ONE event's raw odds response, resolve each requested market down to
 *  a single bookmaker's outcome list, following the priority chain, and
 *  apply your margin. Markets no priority bookmaker covers are simply
 *  omitted (never silently substituted with a random thin bookmaker). */
function resolveBestOdds(eventData, sportKey, marginPct) {
  const priority = getBookmakerPriority(sportKey);
  const resolved = {};

  for (const bookKey of priority) {
    const book = eventData.bookmakers?.find(b => b.key === bookKey);
    if (!book) continue;
    for (const market of book.markets) {
      if (resolved[market.key]) continue; // already filled by a higher-priority book
      resolved[market.key] = {
        source: bookKey,
        lastUpdate: market.last_update,
        outcomes: market.outcomes.map(o => ({
          ...o,
          price: applyMargin(o.price, marginPct),
          rawPrice: o.price,
        })),
      };
    }
  }
  return resolved;
}

// ═══════════════════════════════════════════════════════════════════════════
// LIGHTWEIGHT TTL CACHE — prevents user traffic from ever reaching upstream.
// Swap the Map for Redis in production; get/set signatures stay identical.
// ═══════════════════════════════════════════════════════════════════════════
const cache = new Map(); // key -> { data, expiresAt }

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) { cache.delete(key); return null; }
  return hit.data;
}
function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Suggested TTLs (ms) — tune based on how close to kickoff the event is.
 *  This is the "tiered refresh" strategy: far-out matches cache longer. */
const TTL = {
  EVENTS_LIST:        30 * 60 * 1000,  // 30 min — free endpoint anyway
  ODDS_FAR:            3 * 60 * 60 * 1000, // 3 hrs — match 3+ days away
  ODDS_TODAY:              10 * 60 * 1000, // 10 min — match today
  ODDS_SOON:                5 * 60 * 1000, // 5 min — match within 3 hrs
  MARKET_DISCOVERY:        60 * 60 * 1000, // 1 hr — which markets exist rarely changes fast
  SCORES:                   5 * 60 * 1000, // 5 min — only poll while matches are live
};

/** Pick a TTL bucket based on how far away commence_time is. */
function ttlForCommenceTime(commenceTimeIso) {
  const msUntil = new Date(commenceTimeIso).getTime() - Date.now();
  if (msUntil > 3 * 24 * 60 * 60 * 1000) return TTL.ODDS_FAR;
  if (msUntil > 3 * 60 * 60 * 1000)      return TTL.ODDS_TODAY;
  return TTL.ODDS_SOON;
}

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Axios client (upstream) ────────────────────────────────────────────────
const upstream = axios.create({
  baseURL: ODDS_API_BASE,
  timeout: 12000,
});

// ── In-memory mock wallet (replace with DB in production) ─────────────────
let mockBalance = 2500.00;
const betHistory = [];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Forward upstream quota headers to the client response, AND log them so
 *  you can build the "credits running low" alert mentioned earlier. */
function forwardQuotaHeaders(upstreamRes, res) {
  const keys = ['x-requests-remaining', 'x-requests-used', 'x-requests-last'];
  keys.forEach(k => {
    if (upstreamRes.headers[k] !== undefined) {
      res.set(k, upstreamRes.headers[k]);
      if (k === 'x-requests-remaining') {
        const remaining = parseInt(upstreamRes.headers[k], 10);
        if (!Number.isNaN(remaining) && remaining < 500) {
          console.warn(`⚠️  Odds API quota low: ${remaining} requests remaining`);
        }
      }
    }
  });
}

/** Standard error responder */
function handleError(res, error, context = '') {
  const status  = error.response?.status  || 500;
  const details = error.response?.data    || error.message;
  console.error(`[Odds API Error] ${context}:`, details);
  res.status(status).json({ success: false, error: `${context} failed`, details });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1.  SPORTS / TAXONOMY  (all free — unchanged from v1, kept as-is)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/sports', async (req, res) => {
  try {
    const all = req.query.all === 'true';
    const r   = await upstream.get('/sports', {
      params: { apiKey: ODDS_API_KEY, ...(all && { all: 'true' }) },
    });
    forwardQuotaHeaders(r, res);
    res.json({ success: true, count: r.data.length, data: r.data });
  } catch (e) {
    handleError(res, e, 'GET /api/sports');
  }
});

app.get('/api/sports/types', async (req, res) => {
  try {
    const r = await upstream.get('/sports', { params: { apiKey: ODDS_API_KEY } });
    forwardQuotaHeaders(r, res);

    const typeMap = {};
    r.data.forEach(s => {
      const grp = s.group || 'Other';
      if (!typeMap[grp]) {
        typeMap[grp] = { key: grp.toLowerCase().replace(/\s+/g, '_'), name: grp, leagueCount: 0 };
      }
      typeMap[grp].leagueCount++;
    });

    const types = Object.values(typeMap).sort((a, b) => b.leagueCount - a.leagueCount);
    res.json({ success: true, count: types.length, data: types });
  } catch (e) {
    handleError(res, e, 'GET /api/sports/types');
  }
});

app.get('/api/sports/top-leagues', async (req, res) => {
  const TOP_KEYS = [
    'soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga',
    'soccer_italy_serie_a', 'soccer_france_ligue_one', 'soccer_uefa_champs_league',
    'basketball_nba', 'americanfootball_nfl', 'tennis_atp_french_open', 'cricket_ipl',
  ];

  try {
    const r = await upstream.get('/sports', { params: { apiKey: ODDS_API_KEY } });
    forwardQuotaHeaders(r, res);

    const all      = r.data;
    const topFixed = TOP_KEYS.map(k => all.find(s => s.key === k)).filter(Boolean);
    const active   = all.filter(s => s.active && !TOP_KEYS.includes(s.key));
    const result   = topFixed.length >= 5
      ? topFixed
      : [...topFixed, ...active.slice(0, 10 - topFixed.length)];

    res.json({ success: true, count: result.length, data: result });
  } catch (e) {
    handleError(res, e, 'GET /api/sports/top-leagues');
  }
});

app.get('/api/sports/top-matches', async (req, res) => {
  const sport   = req.query.sport   || 'soccer_epl';
  const markets = sanitiseMarkets(req.query.markets || 'h2h');
  const regions = req.query.regions || DEFAULT_REGIONS;

  try {
    const r = await upstream.get(`/sports/${sport}/odds`, {
      params: { apiKey: ODDS_API_KEY, regions, markets, dateFormat: 'iso', oddsFormat: DEFAULT_ODDS_FMT },
    });
    forwardQuotaHeaders(r, res);
    res.json({ success: true, sport, count: r.data.length, data: r.data.slice(0, 6) });
  } catch (e) {
    handleError(res, e, 'GET /api/sports/top-matches');
  }
});

/**
 * GET /api/sports/:sportType/countries
 * FIXED — the old version grouped by `s.group`, which is the sport
 * category ("Soccer"), not a country, so every league landed in one bucket.
 * Now uses resolveCountry() (manual map + pattern fallback) to build real
 * country groupings.
 * Quota: FREE
 *
 * Postman:
 *   GET http://localhost:3000/api/sports/soccer/countries
 */
app.get('/api/sports/:sportType/countries', async (req, res) => {
  const { sportType } = req.params;
  try {
    const r = await upstream.get('/sports', { params: { apiKey: ODDS_API_KEY } });
    forwardQuotaHeaders(r, res);

    const matching = r.data.filter(s => s.key.toLowerCase().startsWith(sportType.toLowerCase()));

    const countryMap = {};
    matching.forEach(s => {
      const country = resolveCountry(s.key);
      const code = country.toLowerCase().replace(/[\s/]+/g, '_');
      if (!countryMap[code]) {
        countryMap[code] = { code, name: country, leagueCount: 0, leagues: [] };
      }
      countryMap[code].leagueCount++;
      countryMap[code].leagues.push({ key: s.key, title: s.title });
    });

    const countries = Object.values(countryMap).sort((a, b) => b.leagueCount - a.leagueCount);
    res.json({ success: true, sportType, count: countries.length, data: countries });
  } catch (e) {
    handleError(res, e, `GET /api/sports/${req.params.sportType}/countries`);
  }
});

/**
 * GET /api/sports/:sportType/countries/:countryCode/leagues
 * FIXED — same underlying bug as above. countryCode should be the `code`
 * value returned by the /countries endpoint above (e.g. "england", "spain").
 * Quota: FREE
 *
 * Postman:
 *   GET http://localhost:3000/api/sports/soccer/countries/england/leagues
 *   GET http://localhost:3000/api/sports/soccer/countries/spain/leagues
 */
app.get('/api/sports/:sportType/countries/:countryCode/leagues', async (req, res) => {
  const { sportType, countryCode } = req.params;
  try {
    const r = await upstream.get('/sports', { params: { apiKey: ODDS_API_KEY } });
    forwardQuotaHeaders(r, res);

    const target = countryCode.toLowerCase();
    const leagues = r.data
      .filter(s => s.key.toLowerCase().startsWith(sportType.toLowerCase()))
      .filter(s => resolveCountry(s.key).toLowerCase().replace(/[\s/]+/g, '_') === target)
      .map(s => ({ sportKey: s.key, title: s.title, description: s.description, active: s.active, hasOutrights: s.has_outrights }));

    res.json({ success: true, sportType, countryCode, count: leagues.length, data: leagues });
  } catch (e) {
    handleError(res, e, `GET /api/sports/${req.params.sportType}/countries/${req.params.countryCode}/leagues`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2.  MARKET CATALOG — new: lets the front-end discover what markets exist
//     and which category they fall into, without hardcoding the list client-side.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/markets/catalog
 * Returns every known market key grouped by category (featured / additional /
 * game period / other soccer / soccer player props). Free — no upstream call.
 *
 * Postman: GET http://localhost:3000/api/markets/catalog
 */
app.get('/api/markets/catalog', (_req, res) => {
  res.json({ success: true, data: MARKET_CATALOG });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3.  ODDS FEED
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/odds/:sportKey
 * Bulk odds across an entire league. Auto-uses the bulk endpoint since this
 * route only makes sense for featured markets (h2h/spreads/totals/outrights).
 * Non-featured markets requested here are silently dropped with a warning —
 * use /api/odds/:sportKey/events/:eventId for those instead.
 * Quota: markets × regions (or markets × bookmakers.length if bookmakers used)
 *
 * Postman:
 *   GET http://localhost:3000/api/odds/soccer_epl
 *   GET http://localhost:3000/api/odds/soccer_epl?markets=h2h,totals&bookmakers=pinnacle
 */
app.get('/api/odds/:sportKey', async (req, res) => {
  const { sportKey } = req.params;
  const requestedMarkets = sanitiseMarkets(req.query.markets);
  const featuredOnly = requestedMarkets.split(',').filter(m => FEATURED_MARKETS.has(m));
  const markets = featuredOnly.length ? featuredOnly.join(',') : 'h2h';
  const oddsFormat = req.query.oddsFormat || DEFAULT_ODDS_FMT;

  // Prefer explicit bookmakers (cheaper, deterministic) over regions.
  const params = { apiKey: ODDS_API_KEY, markets, oddsFormat, dateFormat: 'iso' };
  if (req.query.bookmakers) params.bookmakers = req.query.bookmakers;
  else params.regions = req.query.regions || DEFAULT_REGIONS;

  const cacheKey = `bulk:${sportKey}:${JSON.stringify(params)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ success: true, sportKey, count: cached.length, data: cached, cached: true });

  try {
    const r = await upstream.get(`/sports/${sportKey}/odds`, { params });
    forwardQuotaHeaders(r, res);
    cacheSet(cacheKey, r.data, TTL.ODDS_TODAY);
    res.json({ success: true, sportKey, count: r.data.length, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/odds/${sportKey}`);
  }
});

/**
 * GET /api/odds/:sportKey/events/:eventId
 * Full odds for ONE event, any market (featured or not). This is the route
 * to use for btts, correct_score, alternates, half-time markets, props, etc.
 * Quota: markets × (regions OR bookmakers count)
 *
 * Postman:
 *   GET http://localhost:3000/api/odds/soccer_epl/events/EVENT_ID?markets=btts,correct_score,double_chance
 *   GET http://localhost:3000/api/odds/soccer_epl/events/EVENT_ID?markets=h2h_3_way_h1,totals_h1
 *   GET http://localhost:3000/api/odds/soccer_epl/events/EVENT_ID?bookmakers=pinnacle,williamhill
 */
app.get('/api/odds/:sportKey/events/:eventId', async (req, res) => {
  const { sportKey, eventId } = req.params;
  const oddsFormat = req.query.oddsFormat || DEFAULT_ODDS_FMT;
  const markets = req.query.markets
    ? sanitiseMarkets(req.query.markets)
    : 'h2h,h2h_3_way,totals,btts,double_chance'; // sensible soccer default

  const params = { apiKey: ODDS_API_KEY, markets, oddsFormat, dateFormat: 'iso' };
  if (req.query.bookmakers) params.bookmakers = req.query.bookmakers;
  else params.regions = req.query.regions || DEFAULT_REGIONS;

  const cacheKey = `event:${sportKey}:${eventId}:${JSON.stringify(params)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ success: true, sportKey, eventId, markets, data: cached, cached: true });

  try {
    const r = await upstream.get(`/sports/${sportKey}/events/${eventId}/odds`, { params });
    forwardQuotaHeaders(r, res);
    const ttl = r.data?.commence_time ? ttlForCommenceTime(r.data.commence_time) : TTL.ODDS_TODAY;
    cacheSet(cacheKey, r.data, ttl);
    res.json({ success: true, sportKey, eventId, markets, data: r.data });
  } catch (e) {
    // INVALID_MARKET (wrong endpoint) or INVALID_MARKET_COMBO → retry h2h only.
    const code = e.response?.data?.error_code;
    if (code === 'INVALID_MARKET' || code === 'INVALID_MARKET_COMBO') {
      try {
        const retryParams = { ...params, markets: 'h2h' };
        const retry = await upstream.get(`/sports/${sportKey}/events/${eventId}/odds`, { params: retryParams });
        forwardQuotaHeaders(retry, res);
        return res.json({ success: true, sportKey, eventId, markets: 'h2h', data: retry.data, fellBackFrom: markets });
      } catch (retryErr) {
        return handleError(res, retryErr, `GET /api/odds/${sportKey}/events/${eventId} (retry)`);
      }
    }
    handleError(res, e, `GET /api/odds/${sportKey}/events/${eventId}`);
  }
});

/**
 * GET /api/odds/:sportKey/events/:eventId/best
 * NEW — the endpoint your front-end should actually call for a match page.
 * Fetches raw odds, then collapses each market down to ONE bookmaker's price
 * (following the priority/fallback chain) and applies your house margin.
 * This is what "pick one book, not all 20" looks like in code.
 *
 * Query params:
 *   markets — comma list (defaults to a broad soccer set)
 *   margin  — override the house margin % for this call (default from .env)
 *
 * Postman:
 *   GET http://localhost:3000/api/odds/soccer_epl/events/EVENT_ID/best
 *   GET http://localhost:3000/api/odds/soccer_epl/events/EVENT_ID/best?markets=h2h,totals,btts&margin=8
 */
app.get('/api/odds/:sportKey/events/:eventId/best', async (req, res) => {
  const { sportKey, eventId } = req.params;
  const markets = req.query.markets
    ? sanitiseMarkets(req.query.markets)
    : 'h2h,h2h_3_way,totals,alternate_totals,btts,double_chance,draw_no_bet,correct_score';
  const margin = req.query.margin ? parseFloat(req.query.margin) : DEFAULT_MARGIN;

  // Pull odds from exactly the bookmakers in our priority chain — cheaper
  // than a whole region, and guarantees we know who's in the response.
  const priority = getBookmakerPriority(sportKey);
  const params = {
    apiKey: ODDS_API_KEY,
    markets,
    bookmakers: priority.join(','),
    oddsFormat: DEFAULT_ODDS_FMT,
    dateFormat: 'iso',
  };

  const cacheKey = `best:${sportKey}:${eventId}:${markets}:${margin}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ success: true, sportKey, eventId, data: cached, cached: true });

  try {
    const r = await upstream.get(`/sports/${sportKey}/events/${eventId}/odds`, { params });
    forwardQuotaHeaders(r, res);

    const resolved = resolveBestOdds(r.data, sportKey, margin);
    const payload = {
      eventId: r.data.id,
      homeTeam: r.data.home_team,
      awayTeam: r.data.away_team,
      commenceTime: r.data.commence_time,
      marginApplied: margin,
      markets: resolved, // { h2h: { source: 'pinnacle', outcomes: [...] }, ... }
    };

    const ttl = ttlForCommenceTime(r.data.commence_time);
    cacheSet(cacheKey, payload, ttl);
    res.json({ success: true, sportKey, eventId, data: payload });
  } catch (e) {
    handleError(res, e, `GET /api/odds/${sportKey}/events/${eventId}/best`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4.  EVENTS  (no odds — free)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/events/:sportKey', async (req, res) => {
  const { sportKey } = req.params;
  const cacheKey = `events:${sportKey}:${req.query.commenceTimeFrom || ''}:${req.query.commenceTimeTo || ''}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ success: true, sportKey, count: cached.length, data: cached, cached: true });

  try {
    const r = await upstream.get(`/sports/${sportKey}/events`, {
      params: {
        apiKey: ODDS_API_KEY,
        dateFormat: 'iso',
        ...(req.query.commenceTimeFrom && { commenceTimeFrom: req.query.commenceTimeFrom }),
        ...(req.query.commenceTimeTo   && { commenceTimeTo:   req.query.commenceTimeTo   }),
      },
    });
    forwardQuotaHeaders(r, res);
    cacheSet(cacheKey, r.data, TTL.EVENTS_LIST);
    res.json({ success: true, sportKey, count: r.data.length, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/events/${sportKey}`);
  }
});

app.get('/api/events/:sportKey/:eventId/markets', async (req, res) => {
  const { sportKey, eventId } = req.params;
  const regions = req.query.regions || DEFAULT_REGIONS;
  const cacheKey = `discovery:${sportKey}:${eventId}:${regions}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ success: true, sportKey, eventId, data: cached, cached: true });

  try {
    const r = await upstream.get(`/sports/${sportKey}/events/${eventId}/markets`, {
      params: { apiKey: ODDS_API_KEY, regions, dateFormat: 'iso' },
    });
    forwardQuotaHeaders(r, res);
    cacheSet(cacheKey, r.data, TTL.MARKET_DISCOVERY);
    res.json({ success: true, sportKey, eventId, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/events/${sportKey}/${eventId}/markets`);
  }
});

app.get('/api/events/:sportKey/:eventId/market-count', async (req, res) => {
  const { sportKey, eventId } = req.params;
  const regions = req.query.regions || DEFAULT_REGIONS;

  try {
    const r = await upstream.get(`/sports/${sportKey}/events/${eventId}/markets`, {
      params: { apiKey: ODDS_API_KEY, regions, dateFormat: 'iso' },
    });
    forwardQuotaHeaders(r, res);

    const marketSet = new Set();
    const data = r.data;
    if (Array.isArray(data)) {
      data.forEach(bookmaker => {
        if (Array.isArray(bookmaker.markets)) {
          bookmaker.markets.forEach(mkt => { if (mkt.key) marketSet.add(mkt.key); });
        }
      });
    }
    const markets = Array.from(marketSet).sort();
    res.json({ success: true, sportKey, eventId, marketCount: markets.length, markets });
  } catch (e) {
    const status = e.response?.status || 500;
    console.error(`[market-count] ${sportKey}/${eventId}:`, e.response?.data || e.message);
    res.status(status).json({ success: false, sportKey, eventId, marketCount: 0, markets: [], error: e.response?.data || e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 5.  SCORES  (live + recent results)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/scores/:sportKey', async (req, res) => {
  const { sportKey } = req.params;
  const daysFrom = req.query.daysFrom;
  const cacheKey = `scores:${sportKey}:${daysFrom || 'live'}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ success: true, sportKey, count: cached.length, data: cached, cached: true });

  try {
    const r = await upstream.get(`/sports/${sportKey}/scores`, {
      params: { apiKey: ODDS_API_KEY, dateFormat: 'iso', ...(daysFrom && { daysFrom }) },
    });
    forwardQuotaHeaders(r, res);
    cacheSet(cacheKey, r.data, TTL.SCORES);
    res.json({ success: true, sportKey, count: r.data.length, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/scores/${sportKey}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 6.  PARTICIPANTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/participants/:sportKey', async (req, res) => {
  const { sportKey } = req.params;
  try {
    const r = await upstream.get(`/sports/${sportKey}/participants`, { params: { apiKey: ODDS_API_KEY } });
    forwardQuotaHeaders(r, res);
    res.json({ success: true, sportKey, count: r.data.length, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/participants/${sportKey}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 7.  WALLET & BETS  (mock — replace with DB + real payment review flow)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/user/balance', (_req, res) => {
  res.json({ success: true, balance: mockBalance, currency: 'ETB' });
});

app.post('/api/bets', (req, res) => {
  const { bets, stake } = req.body;
  if (!Array.isArray(bets) || bets.length === 0) {
    return res.status(400).json({ success: false, error: 'Bet slip is empty.' });
  }
  if (typeof stake !== 'number' || stake <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid stake amount.' });
  }
  if (stake > mockBalance) {
    return res.status(400).json({ success: false, error: 'Insufficient wallet balance.' });
  }

  const totalOdds       = parseFloat(bets.reduce((acc, b) => acc * (b.odd || 1), 1).toFixed(4));
  const potentialPayout = parseFloat((stake * totalOdds).toFixed(2));
  mockBalance -= stake;

  const ticket = {
    ticketId: `ETB-${Math.floor(100000 + Math.random() * 900000)}`,
    bets, stake, totalOdds, potentialPayout,
    status: 'PENDING', currency: 'ETB', createdAt: new Date().toISOString(),
  };
  betHistory.push(ticket);
  console.log(`[Bet] New ticket ${ticket.ticketId} — stake ${stake} ETB, odds ${totalOdds}, payout ${potentialPayout}`);
  res.json({ success: true, message: 'Bet placed successfully.', newBalance: mockBalance, ticket });
});

app.get('/api/bets', (_req, res) => {
  res.json({ success: true, count: betHistory.length, data: betHistory });
});

/**
 * POST /api/user/deposit
 * Mock deposit top-up. In production, this should NOT credit the balance
 * directly — it should create a `payment_proofs` row with status 'pending'
 * (screenshot + tx reference + amount) and only credit the wallet once an
 * admin approves it against your Telebirr/CBE statement. See the payment
 * strategy notes from earlier in this conversation.
 *
 * Postman: POST http://localhost:3000/api/user/deposit
 * Body: { "amount": 500, "method": "telebirr", "txReference": "ABC123", "screenshotUrl": "..." }
 */
app.post('/api/user/deposit', (req, res) => {
  const { amount, method, txReference } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid deposit amount.' });
  }
  // MOCK ONLY — replace with: create pending payment_proofs row, notify admin,
  // wait for approval, THEN increment balance.
  mockBalance += amount;
  res.json({
    success: true,
    message: `Deposited ${amount} ETB via ${method || 'unknown'} (mock — auto-approved, tx: ${txReference || 'none'})`,
    newBalance: mockBalance,
    currency: 'ETB',
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8.  ADMIN / OPS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/cache-stats
 * Quick visibility into the in-memory cache — useful while testing to
 * confirm you're actually hitting cache instead of upstream repeatedly.
 *
 * Postman: GET http://localhost:3000/api/admin/cache-stats
 */
app.get('/api/admin/cache-stats', (_req, res) => {
  const entries = [...cache.entries()].map(([key, val]) => ({
    key,
    expiresInSeconds: Math.max(0, Math.round((val.expiresAt - Date.now()) / 1000)),
  }));
  res.json({ success: true, totalEntries: entries.length, entries });
});

/**
 * POST /api/admin/cache-clear
 * Wipe the cache — use after manually correcting an odds issue.
 *
 * Postman: POST http://localhost:3000/api/admin/cache-clear
 */
app.post('/api/admin/cache-clear', (_req, res) => {
  const count = cache.size;
  cache.clear();
  res.json({ success: true, cleared: count });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9.  HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'OK',
    server: 'Edilbetting Odds Proxy v2.0',
    upstreamBase: ODDS_API_BASE,
    apiKeySet: !!ODDS_API_KEY,
    cacheSize: cache.size,
    defaultMarginPct: DEFAULT_MARGIN,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 catch-all ─────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found. Check ODDS_API_DOCS.md for all routes.' });
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎲  Edilbetting Odds Server v2`);
  console.log(`   Running  → http://localhost:${PORT}/api`);
  console.log(`   Health   → http://localhost:${PORT}/api/health`);
  console.log(`   Catalog  → http://localhost:${PORT}/api/markets/catalog`);
  console.log(`   API key  → ${ODDS_API_KEY ? '✅ set' : '❌ MISSING — check .env'}\n`);
});
