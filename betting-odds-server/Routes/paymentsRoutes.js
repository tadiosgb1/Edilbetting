'use strict';
const express=require('express'); const router=express.Router(); const ctrl=require('../controllers/paymentController'); const asyncHandler=require('../middleware/asyncHandler');
router.post('/deposit-request', asyncHandler(ctrl.submitDepositRequest));
router.get('/', asyncHandler(ctrl.listPayments));
router.get('/pending', asyncHandler(ctrl.listPending));
router.post('/:id/approve', asyncHandler(ctrl.approvePayment));
router.post('/:id/reject', asyncHandler(ctrl.rejectPayment));
module.exports=router;
