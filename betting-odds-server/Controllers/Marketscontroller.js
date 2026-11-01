'use strict';
const { MARKET_CATALOG } = require('../services/marketCatalog');

/**
 * GET /api/markets/catalog
 * Returns every known market key grouped by category.
 * No upstream call — served from in-memory catalog.
 */
async function getCatalog(req, res) {
  res.json({ success: true, data: MARKET_CATALOG });
}

module.exports = { getCatalog };
