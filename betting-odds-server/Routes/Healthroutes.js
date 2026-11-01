const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Server and database sanity check
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Server, DB, and API key sanity check
 *     tags: [Health]
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (_req, res) => {
  let dbConnected = false;
  try {
    await sequelize.authenticate();
    dbConnected = true;
  } catch (_e) {
    dbConnected = false;
  }

  res.json({
    success: true,
    status: 'OK',
    server: 'Edilbetting Backend v1.0',
    dbConnected,
    apiKeySet: !!process.env.ODDS_API_KEY,
    cronEnabled: process.env.CRON_ENABLED === 'true',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;