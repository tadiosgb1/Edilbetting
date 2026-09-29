'use strict';
const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/walletController');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: User wallet balance and transaction ledger
 */

/**
 * @swagger
 * /wallet/{userId}/balance:
 *   get:
 *     summary: Get wallet balance for a user
 *     tags: [Wallet]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Balance response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean }
 *                 balance:  { type: number }
 *                 currency: { type: string, example: ETB }
 */
router.get('/:userId/balance',      asyncHandler(ctrl.getBalance));

/**
 * @swagger
 * /wallet/{userId}/transactions:
 *   get:
 *     summary: Wallet transaction ledger for a user (latest 100)
 *     tags: [Wallet]
 */
router.get('/:userId/transactions', asyncHandler(ctrl.getTransactions));

module.exports = router;
