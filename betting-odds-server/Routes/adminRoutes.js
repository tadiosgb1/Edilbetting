'use strict';
const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/adminController');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Manual sync triggers, cache management, usage stats
 */

/**
 * @swagger
 * /admin/sync/sports:
 *   post:
 *     summary: Manually trigger a sports sync from The Odds API
 *     tags: [Admin]
 *     responses:
 *       200: { description: Count of upserted sports }
 */
router.post('/sync/sports',  asyncHandler(ctrl.triggerSyncSports));

/**
 * @swagger
 * /admin/sync/events:
 *   post:
 *     summary: Manually trigger an events sync
 *     tags: [Admin]
 */
router.post('/sync/events',  asyncHandler(ctrl.triggerSyncEvents));

/**
 * @swagger
 * /admin/sync/odds:
 *   post:
 *     summary: Manually trigger an odds sync for events in the next 24 h
 *     tags: [Admin]
 */
router.post('/sync/odds',    asyncHandler(ctrl.triggerSyncOdds));

/**
 * @swagger
 * /admin/sync/scores:
 *   post:
 *     summary: Manually trigger a scores / results sync
 *     tags: [Admin]
 */
router.post('/sync/scores',  asyncHandler(ctrl.triggerSyncScores));

/**
 * @swagger
 * /admin/usage:
 *   get:
 *     summary: Recent Odds API credit consumption (last 100 calls)
 *     tags: [Admin]
 */
router.get('/usage',         asyncHandler(ctrl.getUsage));

/**
 * @swagger
 * /admin/audit:
 *   get:
 *     summary: Recent admin audit log (last 200 actions)
 *     tags: [Admin]
 */
router.get('/audit',         asyncHandler(ctrl.getAuditLog));

module.exports = router;
