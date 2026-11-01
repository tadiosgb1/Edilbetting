'use strict';
const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/betController');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Bets
 *   description: Bet placement and history
 */

/**
 * @swagger
 * /bets:
 *   post:
 *     summary: Place a new bet
 *     tags: [Bets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, stake, selections]
 *             properties:
 *               userId:     { type: string, format: uuid }
 *               stake:      { type: number, example: 100 }
 *               selections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [eventId, marketKey, outcomeName]
 *                   properties:
 *                     eventId:     { type: string }
 *                     marketKey:   { type: string, example: h2h }
 *                     outcomeName: { type: string, example: Arsenal }
 *                     point:       { type: number, nullable: true }
 *     responses:
 *       201: { description: Bet placed successfully }
 *       400: { description: Validation error or insufficient balance }
 */
router.post('/', asyncHandler(ctrl.placeBet));

/**
 * @swagger
 * /bets/{userId}:
 *   get:
 *     summary: Bet history for a user
 *     tags: [Bets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: List of bets with selections }
 */
router.get('/:userId', asyncHandler(ctrl.getBetsForUser));

/**
 * @swagger
 * /bets/{userId}/{betId}:
 *   get:
 *     summary: Single bet detail
 *     tags: [Bets]
 */
router.get('/:userId/:betId', asyncHandler(ctrl.getBetById));
router.put('/:userId/:betId', asyncHandler(ctrl.updateBet));

/**
 * @swagger
 * /bets/{userId}/{betId}/cancel:
 *   post:
 *     summary: Cancel a player's own pending bet
 *     tags: [Bets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: betId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Bet cancelled successfully }
 *       404: { description: Bet not found }
 *       409: { description: Bet is no longer pending }
 */
router.post('/:userId/:betId/cancel', asyncHandler(ctrl.cancelBet));

module.exports = router;
