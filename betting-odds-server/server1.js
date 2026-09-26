import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Load variables from .env into process.env
dotenv.config();

const app = express();

// Extract ALL variables from environment
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = process.env.ODDS_API_BASE_URL;

const DEFAULT_REGIONS = process.env.DEFAULT_REGIONS || 'us';
const DEFAULT_MARKETS = process.env.DEFAULT_MARKETS || 'h2h';
const DEFAULT_ODDS_FORMAT = process.env.DEFAULT_ODDS_FORMAT || 'decimal';

// Fail fast if critical environment variables are missing
if (!API_KEY) {
  console.error('FATAL ERROR: ODDS_API_KEY is not defined in the .env file.');
  process.exit(1);
}

if (!BASE_URL) {
  console.error('FATAL ERROR: ODDS_API_BASE_URL is not defined in the .env file.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Utility helper to monitor remaining quota
const logQuotaUsage = (headers) => {
  const remaining = headers['x-requests-remaining'];
  const used = headers['x-requests-used'];
  if (remaining !== undefined) {
    console.log(`[API Quota Tracker] Used: ${used} | Remaining: ${remaining}`);
  }
};

// 1. Get list of available sports (Free - Doesn't use quota credits)
app.get('/api/sports', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/sports`, {
      params: { apiKey: API_KEY }
    });

    logQuotaUsage(response.headers);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching sports:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
  }
});

// 2. Get live odds for a sport using .env fallback defaults
app.get('/api/odds/:sport', async (req, res) => {
  const { sport } = req.params;
  const {
    regions = DEFAULT_REGIONS,
    markets = DEFAULT_MARKETS,
    oddsFormat = DEFAULT_ODDS_FORMAT
  } = req.query;

  try {
    const response = await axios.get(`${BASE_URL}/sports/${sport}/odds`, {
      params: {
        apiKey: API_KEY,
        regions,
        markets,
        oddsFormat
      }
    });

    logQuotaUsage(response.headers);

    res.json({
      sport,
      quotaRemaining: response.headers['x-requests-remaining'],
      quotaUsed: response.headers['x-requests-used'],
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching odds:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server environment loaded successfully.`);
  console.log(`Targeting Base URL: ${BASE_URL}`);
  console.log(`Server listening on http://localhost:${PORT}`);
});