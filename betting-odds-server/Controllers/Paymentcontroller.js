'use strict';
const { sequelize, PaymentProof, AuditLog, User, Bet } = require('../Models');
const { adjustBalance, getOrCreateWallet } = require('../services/walletService');

async function requireAdmin(req, res, suppliedAdminUserId) {
  if (!req.auth) { res.status(401).json({ success: false, error: 'Authentication required.' }); return false; }
  const adminUserId = req.auth.userId || req.auth.id || suppliedAdminUserId;
  if (!adminUserId) { res.status(401).json({ success: false, error: 'Authenticated admin user id is missing.' }); return false; }
  return adminUserId;
}

async function submitDepositRequest(req, res) {
  const { userId, betId, method, amount, txReference, senderName, senderPhone, screenshotUrl, imageHash } = req.body;
  if (!userId || !betId || !method || !amount || !screenshotUrl) return res.status(400).json({ success: false, error: 'userId, betId, method, amount and screenshotUrl are required.' });
  const bet = await Bet.findOne({ where: { betId, userId } });
  if (!bet) return res.status(404).json({ success: false, error: 'Bet not found for this user.' });
  if (bet.status !== 'pending') return res.status(409).json({ success: false, error: 'Only pending bets can receive payment proof.' });
  const existingProof = await PaymentProof.findOne({ where: { betId, status: 'pending' } });
  if (existingProof) return res.status(409).json({ success: false, error: 'This bet already has a payment proof awaiting review.' });
  await getOrCreateWallet(userId);
  const proof = await PaymentProof.create({ userId, betId, direction: 'deposit', method, amount, txReference, senderName, senderPhone, screenshotUrl, imageHash, status: 'pending' });
  res.status(201).json({ success: true, message: 'Deposit request submitted for review.', data: proof });
}

async function listPayments(req, res) {
  const adminUserId = await requireAdmin(req, res, req.query.adminUserId);
  if (!adminUserId) return;
  const payments = await PaymentProof.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ success: true, count: payments.length, data: payments });
}

async function listPending(req, res) {
  const adminUserId = await requireAdmin(req, res, req.query.adminUserId);
  if (!adminUserId) return;
  const pending = await PaymentProof.findAll({ where: { status: 'pending' }, order: [['createdAt', 'ASC']] });
  res.json({ success: true, count: pending.length, data: pending });
}

async function approvePayment(req, res) {
  const suppliedAdminUserId = req.body.adminUserId;
  const adminUserId = await requireAdmin(req, res, suppliedAdminUserId);
  if (!adminUserId) return;
  const result = await sequelize.transaction(async (t) => {
    const proof = await PaymentProof.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!proof) throw Object.assign(new Error('Payment proof not found.'), { statusCode: 404 });
    if (proof.status !== 'pending') throw Object.assign(new Error('Already ' + proof.status + '.'), { statusCode: 409 });
    const delta = proof.direction === 'deposit' ? parseFloat(proof.amount) : -parseFloat(proof.amount);
    await adjustBalance(proof.userId, delta, proof.direction, 'payment_proof', String(proof.id), t);
    proof.status = 'approved'; proof.reviewedBy = adminUserId; proof.reviewedAt = new Date();
    await proof.save({ transaction: t });
    let bet = null;
    if (proof.betId) {
      bet = await Bet.findOne({ where: { betId: proof.betId, userId: proof.userId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!bet) throw Object.assign(new Error('Linked bet not found.'), { statusCode: 404 });
      if (bet.status !== 'pending') throw Object.assign(new Error('Linked bet is already ' + bet.status + '.'), { statusCode: 409 });
      bet.status = 'completed'; bet.settledAt = new Date(); await bet.save({ transaction: t });
    }
    await AuditLog.create({ adminUserId, action: 'approve_payment', targetType: 'payment_proof', targetId: String(proof.id), detailsJson: { amount: proof.amount, direction: proof.direction, userId: proof.userId, betId: proof.betId || null } }, { transaction: t });
    return { proof, bet };
  });
  res.json({ success: true, message: 'Payment approved, wallet updated, and linked bet completed.', data: result.proof, bet: result.bet });
}

async function rejectPayment(req, res) {
  const suppliedAdminUserId = req.body.adminUserId;
  const adminUserId = await requireAdmin(req, res, suppliedAdminUserId);
  if (!adminUserId) return;
  const rejectionReason = String(reason || '').trim();
  if (!rejectionReason) return res.status(400).json({ success: false, error: 'A rejection reason is required.' });
  const result = await sequelize.transaction(async (t) => {
    const proof = await PaymentProof.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!proof) throw Object.assign(new Error('Payment proof not found.'), { statusCode: 404 });
    if (proof.status !== 'pending') throw Object.assign(new Error('Already ' + proof.status + '.'), { statusCode: 409 });
    proof.status = 'rejected'; proof.reviewedBy = adminUserId; proof.reviewedAt = new Date(); proof.rejectionReason = rejectionReason;
    await proof.save({ transaction: t });
    await AuditLog.create({ adminUserId, action: 'reject_payment', targetType: 'payment_proof', targetId: String(proof.id), detailsJson: { reason: rejectionReason, userId: proof.userId, betId: proof.betId || null } }, { transaction: t });
    return proof;
  });
  res.json({ success: true, message: 'Payment rejected.', data: result });
}

module.exports = { submitDepositRequest, listPayments, listPending, approvePayment, rejectPayment };
