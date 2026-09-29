/**
 * Edilbetting — Odds API Proxy Server
 * Wraps https://api.the-odds-api.com/v4 and exposes clean REST endpoints
 * to the Vue front-end.  All API calls are proxied here so the key stays
 * server-side and quota usage is centralised.
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

// ── External API config ────────────────────────────────────────────────────
const ODDS_API_KEY     = process.env.ODDS_API_KEY     || '';
const ODDS_API_BASE    = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';
const DEFAULT_REGIONS  = process.env.DEFAULT_REGIONS  || 'eu';
const DEFAULT_MARKETS  = process.env.DEFAULT_MARKETS  || 'h2h';
const DEFAULT_ODDS_FMT = process.env.DEFAULT_ODDS_FORMAT || 'decimal';

// Validated market keys accepted by the upstream API
const VALID_MARKETS = new Set([
  'h2h', 'spreads', 'totals', 'outrights',
  'h2h_lay', 'outrights_lay',
]);

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

/** Sanitise a comma-separated markets string against the whitelist */
function sanitiseMarkets(raw = DEFAULT_MARKETS) {
  const list = raw.split(',').map(m => m.trim()).filter(m => VALID_MARKETS.has(m));
  return list.length ? list.join(',') : DEFAULT_MARKETS;
}

/** Forward upstream quota headers to the client response */
function forwardQuotaHeaders(upstreamRes, res) {
  const keys = ['x-requests-remaining', 'x-requests-used', 'x-requests-last'];
  keys.forEach(k => {
    if (upstreamRes.headers[k] !== undefined) {
      res.set(k, upstreamRes.headers[k]);
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
// 1.  SPORTS / TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/sports
 * All active in-season sports (raw list).
 * Quota: FREE
 *
 * Postman: GET http://localhost:3000/api/sports
 */
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

/**
 * GET /api/sports/types
 * Unique top-level sport type groups (Soccer, Basketball, Tennis …).
 * Quota: FREE  (derived from /sports)
 *
 * Postman: GET http://localhost:3000/api/sports/types
 */
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

/**
 * GET /api/sports/top-leagues
 * Curated list of the most popular leagues.
 * Quota: FREE
 *
 * Postman: GET http://localhost:3000/api/sports/top-leagues
 */
app.get('/api/sports/top-leagues', async (req, res) => {
  const TOP_KEYS = [
    'soccer_epl',
    'soccer_spain_la_liga',
    'soccer_germany_bundesliga',
    'soccer_italy_serie_a',
    'soccer_france_ligue_one',
    'soccer_uefa_champs_league',
    'basketball_nba',
    'americanfootball_nfl',
    'tennis_atp_french_open',
    'cricket_ipl',
  ];

  try {
    const r = await upstream.get('/sports', { params: { apiKey: ODDS_API_KEY } });
    forwardQuotaHeaders(r, res);

    const all      = r.data;
    const topFixed = TOP_KEYS.map(k => all.find(s => s.key === k)).filter(Boolean);
    // If fewer than 5 matched, pad with active sports
    const active   = all.filter(s => s.active && !TOP_KEYS.includes(s.key));
    const result   = topFixed.length >= 5
      ? topFixed
      : [...topFixed, ...active.slice(0, 10 - topFixed.length)];

    res.json({ success: true, count: result.length, data: result });
  } catch (e) {
    handleError(res, e, 'GET /api/sports/top-leagues');
  }
});

/**
 * GET /api/sports/top-matches
 * Featured live/upcoming EPL odds for the homepage hero strip.
 * Quota: 1 credit
 *
 * Postman: GET http://localhost:3000/api/sports/top-matches
 * Optional query: ?sport=soccer_epl&markets=h2h&regions=eu
 */
app.get('/api/sports/top-matches', async (req, res) => {
  const sport   = req.query.sport   || 'soccer_epl';
  const markets = sanitiseMarkets(req.query.markets || 'h2h');
  const regions = req.query.regions || DEFAULT_REGIONS;

  try {
    const r = await upstream.get(`/sports/${sport}/odds`, {
      params: { apiKey: ODDS_API_KEY, regions, markets, dateFormat: 'iso', oddsFormat: DEFAULT_ODDS_FMT },
    });
    forwardQuotaHeaders(r, res);
    // Return first 6 matches for the featured strip
    res.json({ success: true, sport, count: r.data.length, data: r.data.slice(0, 6) });
  } catch (e) {
    handleError(res, e, 'GET /api/sports/top-matches');
  }
});

/**
 * GET /api/sports/:sportType/countries
 * All unique countries/regions that have leagues for a given sport type.
 * Quota: FREE
 *
 * Postman:
 *   GET http://localhost:3000/api/sports/soccer/countries
 *   GET http://localhost:3000/api/sports/basketball/countries
 *   GET http://localhost:3000/api/sports/tennis/countries
 *
 * :sportType examples: soccer, basketball, americanfootball, baseball, cricket, tennis
 */
app.get('/api/sports/:sportType/countries', async (req, res) => {
  const { sportType } = req.params;

  try {
    const r = await upstream.get('/sports', { params: { apiKey: ODDS_API_KEY } });
    forwardQuotaHeaders(r, res);

    // Match sports whose key starts with sportType OR whose group contains sportType
    const matching = r.data.filter(s =>
      s.key.toLowerCase().startsWith(sportType.toLowerCase()) ||
      (s.group && s.group.toLowerCase().includes(sportType.toLowerCase()))
    );

    // Extract unique countries/groups with league count
    const countryMap = {};
    matching.forEach(s => {
      const grp = s.group || 'International';
      if (!countryMap[grp]) {
        countryMap[grp] = {
          code:         grp.toLowerCase().replace(/\s+/g, '_'),
          name:         grp,
          leagueCount:  0,
          leagues:      [],
        };
      }
      countryMap[grp].leagueCount++;
      countryMap[grp].leagues.push({ key: s.key, title: s.title });
    });

    const countries = Object.values(countryMap).sort((a, b) => b.leagueCount - a.leagueCount);
    res.json({ success: true, sportType, count: countries.length, data: countries });
  } catch (e) {
    handleError(res, e, `GET /api/sports/${req.params.sportType}/countries`);
  }
});

/**
 * GET /api/sports/:sportType/countries/:countryCode/leagues
 * All leagues for a specific country within a sport type.
 * Quota: FREE
 *
 * Postman:
 *   GET http://localhost:3000/api/sports/soccer/countries/england/leagues
 *   GET http://localhost:3000/api/sports/soccer/countries/UEFA/leagues
 *   GET http://localhost:3000/api/sports/basketball/countries/USA/leagues
 */
app.get('/api/sports/:sportType/countries/:countryCode/leagues', async (req, res) => {
  const { sportType, countryCode } = req.params;

  try {
    const r = await upstream.get('/sports', { params: { apiKey: ODDS_API_KEY } });
    forwardQuotaHeaders(r, res);

    const targetGroup = countryCode.replace(/_/g, ' ').toLowerCase();

    const leagues = r.data
      .filter(s =>
        (s.key.toLowerCase().startsWith(sportType.toLowerCase()) ||
         (s.group && s.group.toLowerCase().includes(sportType.toLowerCase()))) &&
        s.group && s.group.toLowerCase().includes(targetGroup)
      )
      .map(s => ({
        sportKey:    s.key,
        title:       s.title,
        description: s.description,
        active:      s.active,
        hasOutrights:s.has_outrights,
      }));

    res.json({ success: true, sportType, countryCode, count: leagues.length, data: leagues });
  } catch (e) {
    handleError(res, e, `GET /api/sports/${req.params.sportType}/countries/${req.params.countryCode}/leagues`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2.  ODDS FEED
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/odds/:sportKey
 * Live & upcoming odds for a sport/league.
 * Quota: 1 per region per market
 *
 * Postman:
 *   GET http://localhost:3000/api/odds/soccer_epl
 *   GET http://localhost:3000/api/odds/soccer_epl?markets=h2h,totals&regions=eu
 *   GET http://localhost:3000/api/odds/upcoming          ← next 8 across all sports
 *
 * Query params:
 *   markets  — comma list: h2h, totals, spreads, outrights (default: h2h)
 *   regions  — comma list: eu, uk, us, us2, au           (default: eu)
 *   oddsFormat — decimal | american                       (default: decimal)
 */
app.get('/api/odds/:sportKey', async (req, res) => {
  const { sportKey } = req.params;
  const markets   = sanitiseMarkets(req.query.markets);
  const regions   = req.query.regions   || DEFAULT_REGIONS;
  const oddsFormat= req.query.oddsFormat|| DEFAULT_ODDS_FMT;

  try {
    const r = await upstream.get(`/sports/${sportKey}/odds`, {
      params: { apiKey: ODDS_API_KEY, regions, markets, oddsFormat, dateFormat: 'iso' },
    });
    forwardQuotaHeaders(r, res);
    res.json({ success: true, sportKey, count: r.data.length, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/odds/${sportKey}`);
  }
});

/**
 * GET /api/odds/:sportKey/events/:eventId
 * All available markets for ONE specific event.
 * Quota: 1 per region per market
 *
 * Postman:
 *   GET http://localhost:3000/api/odds/soccer_epl/events/EVENT_ID_HERE
 *   GET http://localhost:3000/api/odds/soccer_epl/events/EVENT_ID_HERE?regions=eu
 *
 * NOTE: markets are auto-selected per sport to avoid INVALID_MARKET_COMBO errors.
 * Get event IDs first from: GET /api/events/soccer_epl
 */
app.get('/api/odds/:sportKey/events/:eventId', async (req, res) => {
  const { sportKey, eventId } = req.params;
  const regions    = req.query.regions    || DEFAULT_REGIONS;
  const oddsFormat = req.query.oddsFormat || DEFAULT_ODDS_FMT;

  // ── Smart market selection per sport to avoid INVALID_MARKET_COMBO ──────
  // The upstream API rejects spreads/outrights for most soccer leagues.
  // Only request markets that are valid for the given sport key.
  let markets;
  if (req.query.markets) {
    // Caller explicitly provided markets — sanitise but still respect them
    markets = sanitiseMarkets(req.query.markets);
  } else {
    // Auto-select based on sport key prefix
    const k = sportKey.toLowerCase();
    if (k.startsWith('soccer') || k.startsWith('rugby') || k.startsWith('aussie')) {
      // Soccer / rugby: h2h + totals only (spreads not available)
      markets = 'h2h,totals';
    } else if (k.startsWith('basketball') || k.startsWith('americanfootball') ||
               k.startsWith('baseball')   || k.startsWith('icehockey')) {
      // US-style sports: all main markets available
      markets = 'h2h,spreads,totals';
    } else if (k.startsWith('golf') || k.startsWith('mma') || k.startsWith('boxing') ||
               k.startsWith('cricket') || k.startsWith('tennis')) {
      // Outright / head-to-head only sports
      markets = 'h2h,outrights';
    } else {
      // Safe fallback for unknown sports
      markets = 'h2h';
    }
  }

  try {
    const r = await upstream.get(`/sports/${sportKey}/events/${eventId}/odds`, {
      params: { apiKey: ODDS_API_KEY, regions, markets, oddsFormat, dateFormat: 'iso' },
    });
    forwardQuotaHeaders(r, res);
    res.json({ success: true, sportKey, eventId, markets, data: r.data });
  } catch (e) {
    // If INVALID_MARKET_COMBO, retry with just h2h
    if (e.response?.data?.error_code === 'INVALID_MARKET_COMBO') {
      try {
        const retry = await upstream.get(`/sports/${sportKey}/events/${eventId}/odds`, {
          params: { apiKey: ODDS_API_KEY, regions, markets: 'h2h', oddsFormat, dateFormat: 'iso' },
        });
        forwardQuotaHeaders(retry, res);
        return res.json({ success: true, sportKey, eventId, markets: 'h2h', data: retry.data });
      } catch (retryErr) {
        return handleError(res, retryErr, `GET /api/odds/${sportKey}/events/${eventId} (retry)`);
      }
    }
    handleError(res, e, `GET /api/odds/${sportKey}/events/${eventId}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3.  EVENTS  (no odds — free)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/events/:sportKey
 * Upcoming & live events without odds.  Use to get event IDs cheaply.
 * Quota: FREE
 *
 * Postman:
 *   GET http://localhost:3000/api/events/soccer_epl
 *   GET http://localhost:3000/api/events/basketball_nba
 */
app.get('/api/events/:sportKey', async (req, res) => {
  const { sportKey } = req.params;

  try {
    const r = await upstream.get(`/sports/${sportKey}/events`, {
      params: {
        apiKey:    ODDS_API_KEY,
        dateFormat: 'iso',
        ...(req.query.commenceTimeFrom && { commenceTimeFrom: req.query.commenceTimeFrom }),
        ...(req.query.commenceTimeTo   && { commenceTimeTo:   req.query.commenceTimeTo   }),
      },
    });
    forwardQuotaHeaders(r, res);
    res.json({ success: true, sportKey, count: r.data.length, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/events/${sportKey}`);
  }
});

/**
 * GET /api/events/:sportKey/:eventId/markets
 * Available market keys per bookmaker for a single event.
 * Quota: 1 credit
 *
 * Postman:
 *   GET http://localhost:3000/api/events/soccer_epl/EVENT_ID_HERE/markets?regions=eu
 */
app.get('/api/events/:sportKey/:eventId/markets', async (req, res) => {
  const { sportKey, eventId } = req.params;
  const regions = req.query.regions || DEFAULT_REGIONS;

  try {
    const r = await upstream.get(`/sports/${sportKey}/events/${eventId}/markets`, {
      params: { apiKey: ODDS_API_KEY, regions, dateFormat: 'iso' },
    });
    forwardQuotaHeaders(r, res);
    res.json({ success: true, sportKey, eventId, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/events/${sportKey}/${eventId}/markets`);
  }
});

/**
 * GET /api/events/:sportKey/:eventId/market-count
 * Returns the total number of unique market keys available for a single event
 * across all bookmakers — used to power the "N+ markets" badge on match cards.
 * Quota: 1 credit  — fetched lazily (only when user clicks the + button)
 *
 * Postman:
 *   GET http://localhost:3000/api/events/soccer_epl/EVENT_ID_HERE/market-count
 *   GET http://localhost:3000/api/events/soccer_epl/EVENT_ID_HERE/market-count?regions=eu
 *
 * Response:
 *   { success: true, sportKey, eventId, marketCount: 47, markets: ["h2h","totals",...] }
 */
app.get('/api/events/:sportKey/:eventId/market-count', async (req, res) => {
  const { sportKey, eventId } = req.params;
  const regions = req.query.regions || DEFAULT_REGIONS;

  try {
    const r = await upstream.get(`/sports/${sportKey}/events/${eventId}/markets`, {
      params: { apiKey: ODDS_API_KEY, regions, dateFormat: 'iso' },
    });
    forwardQuotaHeaders(r, res);

    // Collect all unique market keys across every bookmaker
    const marketSet = new Set();
    const data = r.data;

    if (Array.isArray(data)) {
      data.forEach(bookmaker => {
        if (Array.isArray(bookmaker.markets)) {
          bookmaker.markets.forEach(mkt => {
            if (mkt.key) marketSet.add(mkt.key);
          });
        }
      });
    }

    const markets     = Array.from(marketSet).sort();
    const marketCount = markets.length;

    res.json({ success: true, sportKey, eventId, marketCount, markets });
  } catch (e) {
    // Return 0 gracefully — do not crash the UI if this call fails
    const status = e.response?.status || 500;
    console.error(`[market-count] ${sportKey}/${eventId}:`, e.response?.data || e.message);
    res.status(status).json({
      success:     false,
      sportKey,
      eventId,
      marketCount: 0,
      markets:     [],
      error:       e.response?.data || e.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4.  SCORES  (live + recent results)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/scores/:sportKey
 * Live + upcoming + optionally recently completed scores.
 * Quota: 1 (live only) | 2 (with daysFrom)
 *
 * Postman:
 *   GET http://localhost:3000/api/scores/soccer_epl            ← live only (cost: 1)
 *   GET http://localhost:3000/api/scores/soccer_epl?daysFrom=1 ← incl. yesterday (cost: 2)
 *   GET http://localhost:3000/api/scores/soccer_epl?daysFrom=3 ← incl. last 3 days (cost: 2)
 */
app.get('/api/scores/:sportKey', async (req, res) => {
  const { sportKey } = req.params;
  const daysFrom = req.query.daysFrom;

  try {
    const r = await upstream.get(`/sports/${sportKey}/scores`, {
      params: {
        apiKey:     ODDS_API_KEY,
        dateFormat: 'iso',
        ...(daysFrom && { daysFrom }),
      },
    });
    forwardQuotaHeaders(r, res);
    res.json({ success: true, sportKey, count: r.data.length, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/scores/${sportKey}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 5.  PARTICIPANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/participants/:sportKey
 * Teams or players for a sport.
 * Quota: 1 credit
 *
 * Postman:
 *   GET http://localhost:3000/api/participants/soccer_epl
 *   GET http://localhost:3000/api/participants/basketball_nba
 */
app.get('/api/participants/:sportKey', async (req, res) => {
  const { sportKey } = req.params;

  try {
    const r = await upstream.get(`/sports/${sportKey}/participants`, {
      params: { apiKey: ODDS_API_KEY },
    });
    forwardQuotaHeaders(r, res);
    res.json({ success: true, sportKey, count: r.data.length, data: r.data });
  } catch (e) {
    handleError(res, e, `GET /api/participants/${sportKey}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 6.  WALLET & BETS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/user/balance
 * Current wallet balance.
 *
 * Postman: GET http://localhost:3000/api/user/balance
 */
app.get('/api/user/balance', (_req, res) => {
  res.json({ success: true, balance: mockBalance, currency: 'ETB' });
});

/**
 * POST /api/bets
 * Submit a bet ticket.
 *
 * Postman: POST http://localhost:3000/api/bets
 * Body (JSON):
 * {
 *   "bets": [
 *     { "matchId": "abc123", "matchTitle": "Arsenal vs Chelsea",
 *       "selection": "Home Win (1)", "odd": 2.10 }
 *   ],
 *   "stake": 200,
 *   "totalOdds": 2.10,
 *   "potentialPayout": 420.00
 * }
 */
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

  const totalOdds      = parseFloat(bets.reduce((acc, b) => acc * (b.odd || 1), 1).toFixed(4));
  const potentialPayout= parseFloat((stake * totalOdds).toFixed(2));

  mockBalance -= stake;

  const ticket = {
    ticketId:       `ETB-${Math.floor(100000 + Math.random() * 900000)}`,
    bets,
    stake,
    totalOdds,
    potentialPayout,
    status:         'PENDING',
    currency:       'ETB',
    createdAt:      new Date().toISOString(),
  };

  betHistory.push(ticket);
  console.log(`[Bet] New ticket ${ticket.ticketId} — stake ${stake} ETB, odds ${totalOdds}, payout ${potentialPayout}`);

  res.json({ success: true, message: 'Bet placed successfully.', newBalance: mockBalance, ticket });
});

/**
 * GET /api/bets
 * Bet history.
 *
 * Postman: GET http://localhost:3000/api/bets
 */
app.get('/api/bets', (_req, res) => {
  res.json({ success: true, count: betHistory.length, data: betHistory });
});

/**
 * POST /api/user/deposit
 * Mock deposit top-up.
 *
 * Postman: POST http://localhost:3000/api/user/deposit
 * Body: { "amount": 500, "method": "telebirr" }
 */
app.post('/api/user/deposit', (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid deposit amount.' });
  }
  mockBalance += amount;
  res.json({ success: true, message: `Deposited ${amount} ETB`, newBalance: mockBalance, currency: 'ETB' });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7.  HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/health
 * Server + API key sanity check.
 *
 * Postman: GET http://localhost:3000/api/health
 */
app.get('/api/health', (_req, res) => {
  res.json({
    success:   true,
    status:    'OK',
    server:    `Edilbetting Odds Proxy v1.0`,
    upstreamBase: ODDS_API_BASE,
    apiKeySet: !!ODDS_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 catch-all ─────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found. Check ODDS_API_DOCS.md for all routes.' });
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎲  Edilbetting Odds Server`);
  console.log(`   Running  → http://localhost:${PORT}/api`);
  console.log(`   Health   → http://localhost:${PORT}/api/health`);
  console.log(`   API key  → ${ODDS_API_KEY ? '✅ set' : '❌ MISSING — check .env'}\n`);
});
