'use strict';

const cron = require('node-cron');
const logger = require('../Utils/logger');
const {
  syncSports,
  syncEvents,
  syncScores,
  syncOddsForEvents,
  ENABLED_SPORTS,
} = require('../Services/Syncservice');
const { Event } = require('../Models');

let jobs = [];

async function syncAll() {
  try {
    await syncSports();
    await syncEvents();

    const events = await Event.findAll({
      where: { status: 'upcoming' },
    });

    if (events.length > 0) {
      await syncOddsForEvents(
        events,
        process.env.ODDS_MARKETS || 'h2h,totals',
      );
    }

    logger.info('cronScheduler: sync completed');
  } catch (err) {
    logger.error(`cronScheduler sync failed: ${err.message}`);
  }
}

function start() {
  if (process.env.CRON_ENABLED === 'false') {
    logger.info('cronScheduler: disabled by CRON_ENABLED=false');
    return;
  }

  if (jobs.length) return;

  const syncSchedule = process.env.ODDS_SYNC_CRON || '*/15 * * * *';
  const scoresSchedule = process.env.SCORES_SYNC_CRON || '*/5 * * * *';

  if (!cron.validate(syncSchedule) || !cron.validate(scoresSchedule)) {
    throw new Error('Invalid cron schedule in ODDS_SYNC_CRON or SCORES_SYNC_CRON');
  }

  jobs.push(
    cron.schedule(syncSchedule, syncAll),
    cron.schedule(scoresSchedule, () => syncScores(1)),
  );

  logger.info(`cronScheduler: enabled (odds=${syncSchedule}, scores=${scoresSchedule}, sports=${ENABLED_SPORTS.join(',')})`);

  if (process.env.CRON_RUN_ON_START === 'true') {
    void syncAll();
  }
}

function stop() {
  for (const job of jobs) job.stop();
  jobs = [];
}

module.exports = { start, stop, syncAll };
