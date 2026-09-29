'use strict';
const axios     = require('axios');
const { ApiUsageLog } = require('../models');
const logger    = require('../utils/logger');

const oddsApi = axios.create({
  baseURL: process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4',
  timeout: 15000,
});

/**
 * Single entry point for every upstream Odds API call.
 * - Injects the API key automatically so callers never touch it.
 * - Fires a fire-and-forget usage log row for credit tracking.
 * - Warns when remaining credits drop below 500.
 * - Throws on non-2xx so callers can catch and handle gracefully.
 *
 * @param {string} path      - e.g. '/sports' or '/sports/soccer_epl/odds'
 * @param {object} params    - query params (apiKey is added automatically)
 * @param {object} [opts]
 * @param {function} [opts.onQuota] - called with the raw response headers
 * @returns {Promise<any>}   - response.data
 */
async function callOddsApi(path, params = {}, { onQuota } = {}) {
  const finalParams = { apiKey: process.env.ODDS_API_KEY, ...params };
  const response    = await oddsApi.get(path, { params: finalParams });

  const remaining = response.headers['x-requests-remaining'];
  const used      = response.headers['x-requests-used'];

  if (onQuota) onQuota(response.headers);

  if (remaining !== undefined && parseInt(remaining, 10) < 500) {
    logger.warn(`Odds API quota low: ${remaining} requests remaining`);
  }

  // Fire-and-forget — do not block the response on a DB write
  ApiUsageLog.create({
    endpoint:          path,
    paramsJson:        params,
    creditsUsed:       used       ? parseInt(used, 10)       : null,
    requestsRemaining: remaining  ? parseInt(remaining, 10)  : null,
  }).catch(err => logger.error('Failed to write api_usage_log:', err.message));

  return response.data;
}

module.exports = { oddsApi, callOddsApi };
