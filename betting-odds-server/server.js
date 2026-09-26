import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ODDS_API_KEY = process.env.ODDS_API_KEY || '';
const BASE_URL = 'https://api.the-odds-api.com/v4';

app.use(cors());
app.use(express.json());

// Mock user wallet balance & bet history database
let mockUserBalance = 2500.00;
const placedBets = [];

// Helper: Standard allowed markets for live API requests to avoid 422 errors
const ALLOWED_ODDS_API_MARKETS = ['h2h', 'spreads', 'totals', 'outrights', 'h2h_lay', 'outrights_lay'];

// Helper Axios instance for The Odds API
const oddsApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

// =====================================================================================
// 1. DYNAMIC TAXONOMY & HIERARCHY ENDPOINTS (PROXIED FROM THE ODDS API)
// =====================================================================================

// GET /api/sports/types - Fetch available sport categories dynamically
app.get('/api/sports/types', async (req, res) => {
  try {
    const response = await oddsApiClient.get('/sports', {
      params: { apiKey: ODDS_API_KEY }
    });

    // Extract unique base sport types (e.g., soccer, basketball, tennis)
    const sportTypesSet = new Set();
    response.data.forEach(item => {
      const groupKey = item.group ? item.group.toLowerCase() : item.key.split('_')[0];
      sportTypesSet.add(groupKey);
    });

    const sportTypes = Array.from(sportTypesSet).map(type => ({
      id: type,
      name: type.charAt(0).toUpperCase() + type.slice(1)
    }));

    res.json({ success: true, data: sportTypes });
  } catch (error) {
    console.error('Odds API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch sport types from external provider',
      details: error.response?.data || error.message
    });
  }
});

// GET /api/sports/top-leagues - Fetch active featured leagues directly
app.get('/api/sports/top-leagues', async (req, res) => {
  try {
    const response = await oddsApiClient.get('/sports', {
      params: { apiKey: ODDS_API_KEY }
    });

    // Filter active leagues matching major soccer competitions
    const topKeys = ['soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 'soccer_italy_serie_a', 'soccer_uefa_champs_league'];
    const topLeagues = response.data.filter(sport => topKeys.includes(sport.key));

    res.json({ success: true, data: topLeagues.length > 0 ? topLeagues : response.data.slice(0, 5) });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch top leagues from external provider',
      details: error.response?.data || error.message
    });
  }
});

// GET /api/sports/top-matches - Fetch featured live odds directly
app.get('/api/sports/top-matches', async (req, res) => {
  try {
    const response = await oddsApiClient.get('/sports/soccer_epl/odds', {
      params: {
        apiKey: ODDS_API_KEY,
        regions: req.query.regions || 'eu',
        markets: 'h2h',
        dateFormat: 'iso'
      }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch top matches from external provider',
      details: error.response?.data || error.message
    });
  }
});

// GET /api/sports/:sportType/countries - Fetch available regions/groups dynamically
app.get('/api/sports/:sportType/countries', async (req, res) => {
  const { sportType } = req.params;

  try {
    const response = await oddsApiClient.get('/sports', {
      params: { apiKey: ODDS_API_KEY }
    });

    // Filter sports matching the sportType prefix (e.g., soccer)
    const matchingSports = response.data.filter(s => s.key.startsWith(sportType) || s.group.toLowerCase().includes(sportType));

    // Extract unique countries/groups
    const groupsSet = new Set();
    matchingSports.forEach(s => {
      if (s.group) groupsSet.add(s.group);
    });

    const countries = Array.from(groupsSet).map(group => ({
      code: group.toLowerCase().replace(/\s+/g, '_'),
      name: group
    }));

    res.json({ success: true, sportType, data: countries });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: `Failed to fetch countries for ${sportType}`,
      details: error.response?.data || error.message
    });
  }
});

// GET /api/sports/:sportType/countries/:countryCode/leagues - Fetch specific sportKeys
app.get('/api/sports/:sportType/countries/:countryCode/leagues', async (req, res) => {
  const { sportType, countryCode } = req.params;

  try {
    const response = await oddsApiClient.get('/sports', {
      params: { apiKey: ODDS_API_KEY }
    });

    const formattedCountry = countryCode.replace(/_/g, ' ').toLowerCase();

    // Filter active leagues belonging to that group/country
    const leagues = response.data
      .filter(s => s.key.startsWith(sportType) && s.group.toLowerCase().includes(formattedCountry))
      .map(s => ({
        sportKey: s.key,
        name: s.title,
        description: s.description,
        active: s.active
      }));

    res.json({ success: true, sportType, countryCode, data: leagues });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: `Failed to fetch leagues for ${countryCode}`,
      details: error.response?.data || error.message
    });
  }
});

// GET /api/sports - Fetch raw list of all sports directly from provider
app.get('/api/sports', async (req, res) => {
  try {
    const response = await oddsApiClient.get('/sports', {
      params: { apiKey: ODDS_API_KEY }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch sports categories',
      details: error.response?.data || error.message
    });
  }
});

// =====================================================================================
// 2. ODDS FEED ENDPOINTS (DYNAMIC LEAGUE & SINGLE MATCH ODDS)
// =====================================================================================

// GET /api/odds/:sportKey - Fetch active odds for a sport key
app.get('/api/odds/:sportKey', async (req, res) => {
  const { sportKey } = req.params;
  const rawMarkets = req.query.markets || 'h2h,totals';

  try {
    // Sanitize requested markets to avoid 422 errors from invalid keys
    const requestedMarketsArray = rawMarkets.split(',').map(m => m.trim());
    const validMarkets = requestedMarketsArray.filter(m => ALLOWED_ODDS_API_MARKETS.includes(m));
    const finalMarkets = validMarkets.length > 0 ? validMarkets.join(',') : 'h2h,totals';

    const response = await oddsApiClient.get(`/sports/${sportKey}/odds`, {
      params: {
        apiKey: ODDS_API_KEY,
        regions: req.query.regions || 'eu',
        markets: finalMarkets,
        dateFormat: 'iso'
      }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: `Failed to fetch odds for ${sportKey}`,
      details: error.response?.data || error.message
    });
  }
});

// GET /api/odds/:sportKey/events/:eventId - Fetch odds for a single event
app.get('/api/odds/:sportKey/events/:eventId', async (req, res) => {
  const { sportKey, eventId } = req.params;
  const rawMarkets = req.query.markets || 'h2h,totals';

  try {
    const requestedMarketsArray = rawMarkets.split(',').map(m => m.trim());
    const validMarkets = requestedMarketsArray.filter(m => ALLOWED_ODDS_API_MARKETS.includes(m));
    const finalMarkets = validMarkets.length > 0 ? validMarkets.join(',') : 'h2h,totals';

    const response = await oddsApiClient.get(`/sports/${sportKey}/events/${eventId}/odds`, {
      params: {
        apiKey: ODDS_API_KEY,
        regions: req.query.regions || 'eu',
        markets: finalMarkets,
        dateFormat: 'iso'
      }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: `Failed to fetch event odds for event ${eventId}`,
      details: error.response?.data || error.message
    });
  }
});

// =====================================================================================
// 3. BET TICKET & WALLET ENDPOINTS
// =====================================================================================

// GET /api/user/balance - Wallet Balance
app.get('/api/user/balance', (req, res) => {
  res.json({ balance: mockUserBalance, currency: 'ETB' });
});

// POST /api/bets - Dynamic Bet Processing
app.post('/api/bets', (req, res) => {
  const { bets, stake } = req.body;

  if (!bets || !Array.isArray(bets) || bets.length === 0) {
    return res.status(400).json({ error: 'Bet slip cannot be empty.' });
  }

  if (!stake || typeof stake !== 'number' || stake <= 0) {
    return res.status(400).json({ error: 'Invalid stake amount.' });
  }

  if (stake > mockUserBalance) {
    return res.status(400).json({ error: 'Insufficient wallet balance.' });
  }

  const totalOdds = bets.reduce((acc, b) => acc * (b.odd || 1), 1);
  const potentialPayout = parseFloat((stake * totalOdds).toFixed(2));

  mockUserBalance -= stake;

  const ticket = {
    ticketId: `ETB-${Math.floor(100000 + Math.random() * 900000)}`,
    bets,
    stake,
    totalOdds: parseFloat(totalOdds.toFixed(2)),
    potentialPayout,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  placedBets.push(ticket);

  res.json({
    success: true,
    message: 'Bet ticket created successfully.',
    newBalance: mockUserBalance,
    ticket
  });
});

app.listen(PORT, () => {
  console.log(`Betting Integration Server running on http://localhost:${PORT}`);
});