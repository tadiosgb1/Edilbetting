'use strict';
const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/sportsController');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Sports
 *   description: Sport/league discovery — served from our DB, synced on a schedule
 */

/**
 * @swagger
 * /sports:
 *   get:
 *     summary: List all sports/leagues known to the platform
 *     tags: [Sports]
 *     parameters:
 *       - in: query
 *         name: enabled
 *         schema: { type: boolean }
 *         description: true = only leagues we actively offer
 *     responses:
 *       200: { description: List of sports }
 */
router.get('/', asyncHandler(ctrl.listSports));

/**
 * @swagger
 * /sports/types:
 *   get:
 *     summary: Unique sport categories (Soccer, Basketball, Tennis …)
 *     tags: [Sports]
 *     responses:
 *       200: { description: List of sport types with league counts }
 */
router.get('/types', asyncHandler(ctrl.listSportTypes));

/**
 * @swagger
 * /sports/top-leagues:
 *   get:
 *     summary: Curated list of featured leagues
 *     tags: [Sports]
 *     responses:
 *       200: { description: Top leagues }
 */
router.get('/top-leagues', asyncHandler(ctrl.listTopLeagues));

/**
 * @swagger
 * /sports/{sportType}/countries:
 *   get:
 *     summary: Countries that have leagues for a sport type
 *     tags: [Sports]
 *     parameters:
 *       - in: path
 *         name: sportType
 *         required: true
 *         schema: { type: string, example: soccer }
 *     responses:
 *       200: { description: Countries with league counts }
 */
router.get('/:sportType/countries', asyncHandler(ctrl.listCountriesForSportType));

/**
 * @swagger
 * /sports/{sportType}/countries/{countryCode}/leagues:
 *   get:
 *     summary: Leagues for a specific country within a sport type
 *     tags: [Sports]
 *     parameters:
 *       - in: path
 *         name: sportType
 *         required: true
 *         schema: { type: string, example: soccer }
 *       - in: path
 *         name: countryCode
 *         required: true
 *         schema: { type: string, example: england }
 *     responses:
 *       200: { description: List of leagues }
 */
router.get('/:sportType/countries/:countryCode/leagues', asyncHandler(ctrl.listLeaguesForCountry));

module.exports = router;
