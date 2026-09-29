'use strict';
const cron   = require('node-cron');
const { Op } = require('sequelize');
const { Event }                                          = require('../models');
const { syncSports, syncEvents, syncOddsForEvents, syncScores } = require('../services/syncService');
const logger = require('./logger');

// Core markets fetched on every odds refresh. Extend deliberately —
// each extra market costs 1 quota credit per event per refresh cycle.
const CORE_MARKETS = 'h2h,h2h_3_way,totals,btts,double_chance,draw_no_bet,correct_score';

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

/**
 * Tiered refresh strategy:
 *  - matches > 3 days away  → FAR  cadence (every 3 h)
 *  - matches within 24 h    → TODAY cadence (every 10 min)
 *  - matches within 3 h     → SOON cadence  (every 5 min)
 * Each job fetches only the events in its own window so a match is
 * automatically refreshed more often as kickoff approaches.
 */
async function runOddsSyncForWindow(fromHours, toHours) {
  const events = await Event.findAll({
    where: {
      commenceTime: { [Op.between]: [hoursFromNow(fromHours), hoursFromNow(toHours)] },
      status:       'upcoming',
    },
  });
  if (!events.length) return;
  await syncOddsForEvents(events, CORE_MARKETS);
}

function start() {
  if (process.env.CRON_ENABLED !== 'true') {
    logger.info('Cron jobs disabled (CRON_ENABLED != true in .env)');
    return;
  }

  // Sports list — rarely changes; every 6 h is plenty
  cron.schedule(process.env.CRON_SYNC_SPORTS || '0 */6 * * *', () => {
    syncSports().catch(err => logger.error('CRON syncSports failed:', err.message));
  });

  // Upcoming event list — every 30 min
  cron.schedule(process.env.CRON_SYNC_EVENTS || '*/30 * * * *', () => {
    syncEvents().catch(err => logger.error('CRON syncEvents failed:', err.message));
  });

  // Odds: far-out matches (> 3 days)
  cron.schedule(process.env.CRON_SYNC_ODDS_FAR || '0 */3 * * *', () => {
    runOddsSyncForWindow(72, 24 * 30).catch(err => logger.error('CRON odds(far) failed:', err.message));
  });

  // Odds: today's matches (3 h – 24 h to kickoff)
  cron.schedule(process.env.CRON_SYNC_ODDS_TODAY || '*/10 * * * *', () => {
    runOddsSyncForWindow(3, 24).catch(err => logger.error('CRON odds(today) failed:', err.message));
  });

  // Odds: imminent matches (0 – 3 h to kickoff)
  cron.schedule(process.env.CRON_SYNC_ODDS_SOON || '*/5 * * * *', () => {
    runOddsSyncForWindow(0, 3).catch(err => logger.error('CRON odds(soon) failed:', err.message));
  });

  // Live scores + settle events
  cron.schedule(process.env.CRON_SYNC_SCORES || '*/5 * * * *', () => {
    syncScores(1).catch(err => logger.error('CRON syncScores failed:', err.message));
  });

  logger.info('Cron jobs scheduled:');
  logger.info(`  sports     : ${process.env.CRON_SYNC_SPORTS      || '0 */6 * * *'}`);
  logger.info(`  events     : ${process.env.CRON_SYNC_EVENTS      || '*/30 * * * *'}`);
  logger.info(`  odds(far)  : ${process.env.CRON_SYNC_ODDS_FAR    || '0 */3 * * *'}`);
  logger.info(`  odds(today): ${process.env.CRON_SYNC_ODDS_TODAY  || '*/10 * * * *'}`);
  logger.info(`  odds(soon) : ${process.env.CRON_SYNC_ODDS_SOON   || '*/5 * * * *'}`);
  logger.info(`  scores     : ${process.env.CRON_SYNC_SCORES      || '*/5 * * * *'}`);
}

module.exports = { start, runOddsSyncForWindow };
