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

router.post('/deposit-request', asyncHandler(ctrl.submitDepositRequest));

/**
 * Admin payment proof list. The controller validates adminUserId.
 */
router.get('/', asyncHandler(ctrl.listPayments));

router.get('/pending', asyncHandler(ctrl.listPending));

router.post('/:id/approve', asyncHandler(ctrl.approvePayment));

router.post('/:id/reject', asyncHandler(ctrl.rejectPayment));

module.exports = router;
