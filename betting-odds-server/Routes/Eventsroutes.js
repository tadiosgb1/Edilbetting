'use strict';
const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/eventsController');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Match/fixture listings served from our DB
 */

/**
 * @swagger
 * /events/{sportKey}:
 *   get:
 *     summary: List events for a sport/league
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: sportKey
 *         required: true
 *         schema: { type: string, example: soccer_epl }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [upcoming,live,finished,cancelled,postponed] }
 *     responses:
 *       200: { description: List of events }
 */
router.get('/:sportKey',       asyncHandler(ctrl.listEvents));

/**
 * @swagger
 * /events/{sportKey}/today:
 *   get:
 *     summary: Today's events for a sport (UTC day)
 *     tags: [Events]
 */
router.get('/:sportKey/today', asyncHandler(ctrl.listTodayEvents));

/**
 * @swagger
 * /events/{sportKey}/live:
 *   get:
 *     summary: Currently live events for a sport
 *     tags: [Events]
 */
router.get('/:sportKey/live',  asyncHandler(ctrl.listLiveEvents));

/**
 * @swagger
 * /events/{sportKey}/{eventId}:
 *   get:
 *     summary: Single event with current odds
 *     tags: [Events]
 */
router.post('/:sportKey/:eventId/sync', asyncHandler(ctrl.syncEventNow));
router.get('/:sportKey/:eventId/markets', asyncHandler(ctrl.getEventMarkets));
router.get('/:sportKey/:eventId', asyncHandler(ctrl.getEvent));

module.exports = router;
