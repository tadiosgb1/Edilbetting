'use strict';
const bcrypt = require('bcryptjs');
const { syncSports, syncEvents, syncScores } = require('../services/syncService');
const { runOddsSyncForWindow }               = require('../utils/cronScheduler');
const { User, Wallet, ApiUsageLog, AuditLog } = require('../models');

/** POST /api/admin/sync/sports — manual trigger, useful right after first setup */
async function triggerSyncSports(req, res) {
  const count = await syncSports();
  res.json({ success: true, message: `Synced ${count} sports.` });
}

/** POST /api/admin/sync/events */
async function triggerSyncEvents(req, res) {
  const count = await syncEvents();
  res.json({ success: true, message: `Synced ${count} events.` });
}

/** POST /api/admin/sync/odds — pulls odds for events within the next 24 h */
async function triggerSyncOdds(req, res) {
  await runOddsSyncForWindow(0, 24);
  res.json({ success: true, message: 'Odds sync triggered for events in the next 24 h.' });
}

/** POST /api/admin/sync/scores */
async function triggerSyncScores(req, res) {
  const count = await syncScores(1);
  res.json({ success: true, message: `Synced ${count} results.` });
}

/** GET /api/admin/usage — recent Odds API credit consumption */
async function getUsage(req, res) {
  const rows = await ApiUsageLog.findAll({
    order: [['calledAt', 'DESC']],
    limit: 100,
  });
  const latestRemaining = rows.find(r => r.requestsRemaining !== null)?.requestsRemaining ?? null;
  res.json({ success: true, latestRequestsRemaining: latestRemaining, recentCalls: rows });
}

/** GET /api/admin/audit — recent admin actions */
async function getAuditLog(req, res) {
  const rows = await AuditLog.findAll({
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  res.json({ success: true, count: rows.length, data: rows });
}

/**
 * GET /api/admin/bootstrap
 *
 * One-time/idempotent admin bootstrap for a fresh installation.
 *
 * Required environment variables:
 *   ADMIN_PHONE     — initial admin phone number
 *   ADMIN_PASSWORD  — initial admin password (minimum 6 characters)
 * Optional:
 *   ADMIN_NAME      — display name for the initial admin
 *
 * If an admin already exists, this endpoint does not create another account.
 * Credentials are never returned in the response.
 */
async function bootstrapAdmin(req, res) {
  const existingAdmin = await User.findOne({ where: { isAdmin: true } });

  if (existingAdmin) {
    return res.json({
      success: true,
      initialized: true,
      created: false,
      message: 'Admin account is already initialized.',
    });
  }

  const phoneNumber = String(process.env.ADMIN_PHONE || '').trim();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const fullName = String(process.env.ADMIN_NAME || 'Edilbetting Admin').trim();

  if (!phoneNumber || !password) {
    return res.status(503).json({
      success: false,
      initialized: false,
      error: 'Admin bootstrap is not configured. Set ADMIN_PHONE and ADMIN_PASSWORD in the server environment, then restart the server.',
    });
  }

  if (password.length < 6) {
    return res.status(503).json({
      success: false,
      initialized: false,
      error: 'ADMIN_PASSWORD must be at least 6 characters.',
    });
  }

  const existingUser = await User.findOne({ where: { phoneNumber } });

  if (existingUser) {
    existingUser.isAdmin = true;
    existingUser.status = 'active';
    if (fullName) existingUser.fullName = fullName;
    await existingUser.save();

    const wallet = await Wallet.findOne({ where: { userId: existingUser.userId } });
    if (!wallet) {
      await Wallet.create({
        userId: existingUser.userId,
        balance: 0,
        currency: 'ETB',
      });
    }

    return res.json({
      success: true,
      initialized: true,
      created: false,
      promoted: true,
      message: 'Existing user promoted to admin.',
      userId: existingUser.userId,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await User.create({
    phoneNumber,
    fullName: fullName || 'Edilbetting Admin',
    passwordHash,
    kycStatus: 'verified',
    status: 'active',
    isAdmin: true,
  });

  await Wallet.create({
    userId: admin.userId,
    balance: 0,
    currency: 'ETB',
  });

  return res.status(201).json({
    success: true,
    initialized: true,
    created: true,
    message: 'Admin account bootstrapped successfully. Use the configured ADMIN_PHONE and ADMIN_PASSWORD to log in.',
    userId: admin.userId,
  });
}

module.exports = {
  triggerSyncSports,
  triggerSyncEvents,
  triggerSyncOdds,
  triggerSyncScores,
  getUsage,
  getAuditLog,
  bootstrapAdmin,
};