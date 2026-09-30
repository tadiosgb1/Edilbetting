'use strict';
const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/Paymentcontroller');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Deposit/withdrawal screenshot review workflow
 */

/**
 * @swagger
 * /payments/deposit-request:
 *   post:
 *     summary: Submit a deposit screenshot for admin review
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, method, amount, screenshotUrl]
 *             properties:
 *               userId:       { type: string, format: uuid }
 *               method:       { type: string, enum: [telebirr, cbe, other] }
 *               amount:       { type: number, example: 500 }
 *               txReference:  { type: string }
 *               senderName:   { type: string }
 *               senderPhone:  { type: string }
 *               screenshotUrl:{ type: string }
 *               imageHash:    { type: string }
 *     responses:
 *       201: { description: Request submitted for review }
 */
router.post('/deposit-request', asyncHandler(ctrl.submitDepositRequest));

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: List payment proofs for admin review
 *     tags: [Payments]
 *     responses:
 *       200: { description: List of payment proofs }
 */
router.get('/', asyncHandler(ctrl.listPayments));

/**
 * @swagger
 * /payments/pending:
 *   get:
 *     summary: Admin queue of unreviewed payment screenshots
 *     tags: [Payments]
 *     responses:
 *       200: { description: List of pending payment proofs }
 */
router.get('/pending', asyncHandler(ctrl.listPending));

/**
 * @swagger
 * /payments/{id}/approve:
 *   post:
 *     summary: Approve a payment — credits the wallet and completes linked bet
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminUserId: { type: string, format: uuid }
 *     responses:
 *       200: { description: Approved, wallet updated, linked bet completed }
 */
router.post('/:id/approve', asyncHandler(ctrl.approvePayment));

/**
 * @swagger
 * /payments/{id}/reject:
 *   post:
 *     summary: Reject a payment proof
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminUserId: { type: string, format: uuid }
 *               reason:      { type: string }
 *     responses:
 *       200: { description: Payment rejected }
 */
router.post('/:id/reject', asyncHandler(ctrl.rejectPayment));

module.exports = router;
