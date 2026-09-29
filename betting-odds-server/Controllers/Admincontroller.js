'use strict';
const { syncSports, syncEvents, syncScores } = require('../services/syncService');
const { runOddsSyncForWindow }               = require('../utils/cronScheduler');
const { ApiUsageLog, AuditLog }              = require('../models');

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

module.exports = {
  triggerSyncSports,
  triggerSyncEvents,
  triggerSyncOdds,
  triggerSyncScores,
  getUsage,
  getAuditLog,
};
