'use strict';
const { PaymentProof, AuditLog } = require('../Models');
const { adjustBalance, getOrCreateWallet } = require('../services/walletService');

/**
 * POST /api/payments/deposit-request
 * User submits screenshot + tx reference. Stored as 'pending' — wallet
 * balance is NOT credited until an admin approves it.
 * Body: { userId, method, amount, txReference, senderName, senderPhone,
 *         screenshotUrl, imageHash }
 */
async function submitDepositRequest(req, res) {
  const { userId, method, amount, txReference, senderName, senderPhone, screenshotUrl, imageHash } = req.body;

  if (!userId || !method || !amount || !screenshotUrl) {
    return res.status(400).json({
      success: false,
      error:   'userId, method, amount and screenshotUrl are required.',
    });
  }

  await getOrCreateWallet(userId); // ensure wallet row exists

  const proof = await PaymentProof.create({
    userId, direction: 'deposit', method, amount,
    txReference, senderName, senderPhone, screenshotUrl, imageHash,
    status: 'pending',
  });

  res.status(201).json({ success: true, message: 'Deposit request submitted for review.', data: proof });
}

/** GET /api/payments/pending — admin queue of unreviewed screenshots */
async function listPending(req, res) {
  const pending = await PaymentProof.findAll({
    where: { status: 'pending' },
    order: [['createdAt', 'ASC']],
  });
  res.json({ success: true, count: pending.length, data: pending });
}

/**
 * POST /api/payments/:id/approve
 * Admin confirms the screenshot matches the bank/Telebirr statement.
 * ONLY here does the wallet balance actually increase.
 * Body: { adminUserId }
 */
async function approvePayment(req, res) {
  const proof = await PaymentProof.findByPk(req.params.id);
  if (!proof)              return res.status(404).json({ success: false, error: 'Payment proof not found.' });
  if (proof.status !== 'pending') return res.status(400).json({ success: false, error: `Already ${proof.status}.` });

  const delta = proof.direction === 'deposit' ? parseFloat(proof.amount) : -parseFloat(proof.amount);
  await adjustBalance(proof.userId, delta, proof.direction, 'payment_proof', String(proof.id));

  proof.status     = 'approved';
  proof.reviewedBy = req.body.adminUserId;
  proof.reviewedAt = new Date();
  await proof.save();

  await AuditLog.create({
    adminUserId:  req.body.adminUserId,
    action:       'approve_payment',
    targetType:   'payment_proof',
    targetId:     String(proof.id),
    detailsJson:  { amount: proof.amount, direction: proof.direction, userId: proof.userId },
  });

  res.json({ success: true, message: 'Payment approved and wallet updated.', data: proof });
}

/**
 * POST /api/payments/:id/reject
 * Body: { adminUserId, reason }
 */
async function rejectPayment(req, res) {
  const proof = await PaymentProof.findByPk(req.params.id);
  if (!proof)              return res.status(404).json({ success: false, error: 'Payment proof not found.' });
  if (proof.status !== 'pending') return res.status(400).json({ success: false, error: `Already ${proof.status}.` });

  proof.status          = 'rejected';
  proof.reviewedBy      = req.body.adminUserId;
  proof.reviewedAt      = new Date();
  proof.rejectionReason = req.body.reason || 'Not specified';
  await proof.save();

  await AuditLog.create({
    adminUserId: req.body.adminUserId,
    action:      'reject_payment',
    targetType:  'payment_proof',
    targetId:    String(proof.id),
    detailsJson: { reason: proof.rejectionReason, userId: proof.userId },
  });

  res.json({ success: true, message: 'Payment rejected.', data: proof });
}

module.exports = { submitDepositRequest, listPending, approvePayment, rejectPayment };
