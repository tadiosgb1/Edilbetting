'use strict';
const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/oddsController');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Odds
 *   description: Match odds served from our DB — never triggers an upstream call
 */

/**
 * @swagger
 * /odds/{eventId}:
 *   get:
 *     summary: All current odds for one event, grouped by market
 *     tags: [Odds]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: markets
 *         schema: { type: string, example: "h2h,totals,btts" }
 *         description: Comma-separated market keys to filter
 *     responses:
 *       200: { description: Odds grouped by market key }
 *       404: { description: Event not found }
 */
router.get('/:eventId', asyncHandler(ctrl.getOddsForEvent));

module.exports = router;
