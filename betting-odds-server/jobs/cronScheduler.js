'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const logger = require('../Utils/logger');
const {
  syncSports,
  syncEvents,
  syncScores,
  syncOddsForEvents,
  ENABLED_SPORTS,
} = require('../Services/Syncservice');
const { Event, EventMarket, OddsCurrent } = require('../Models');

let jobs = [];

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function syncOddsForWindow(fromHours, toHours) {
  const events = await Event.findAll({
    where: {
      commenceTime: {
        [Op.between]: [hoursFromNow(fromHours), hoursFromNow(toHours)],
      },
      status: 'upcoming',
    },
    order: [['commenceTime', 'ASC']],
  });

  if (!events.length) {
    logger.info(`cronScheduler: no events in window ${fromHours}h-${toHours}h`);
    return 0;
  }

  return syncOddsForEvents(events);
}

async function syncAll() {
  await syncSports();
  await syncEvents();

  const events = await Event.findAll({
    where: { status: 'upcoming' },
    order: [['commenceTime', 'ASC']],
  });

  if (events.length) {
    await syncOddsForEvents(events);
  }

  logger.info(`cronScheduler: full sync completed for ${events.length} upcoming events`);
}

async function startupSyncIfNeeded() {
  const [eventCount, marketCount, oddsCount] = await Promise.all([
    Event.count(),
    EventMarket.count(),
    OddsCurrent.count(),
  ]);

  if (eventCount > 0 && marketCount > 0 && oddsCount > 0) {
    logger.info(
      `startup sync skipped: database already has events=${eventCount}, markets=${marketCount}, odds=${oddsCount}`,
    );
    return;
  }

  logger.info(
    `startup sync required: events=${eventCount}, markets=${marketCount}, odds=${oddsCount}`,
  );
  await syncAll();
}

function start() {
  const enabled = String(process.env.CRON_RUN || '').toLowerCase() === 'true';

  if (!enabled) {
    logger.info('cronScheduler: recurring jobs disabled (CRON_RUN=false)');
    const startupSync = String(process.env.CRON_STARTUP_SYNC ?? 'true').toLowerCase() === 'true';
    if (startupSync) {
      void startupSyncIfNeeded().catch(err => logger.error(`startup sync failed: ${err.message}`));
    }
    return;
  }

  if (jobs.length) return;

  const sportsSchedule = process.env.CRON_SYNC_SPORTS || '0 */6 * * *';
  const eventsSchedule = process.env.CRON_SYNC_EVENTS || '*/30 * * * *';
  const farSchedule = process.env.CRON_SYNC_ODDS_FAR || '0 */3 * * *';
  const todaySchedule = process.env.CRON_SYNC_ODDS_TODAY || '*/10 * * * *';
  const soonSchedule = process.env.CRON_SYNC_ODDS_SOON || '*/5 * * * *';
  const scoresSchedule = process.env.CRON_SYNC_SCORES || '*/5 * * * *';

  const schedules = [
    sportsSchedule,
    eventsSchedule,
    farSchedule,
    todaySchedule,
    soonSchedule,
    scoresSchedule,
  ];

  if (schedules.some(schedule => !cron.validate(schedule))) {
    throw new Error('Invalid cron schedule in CRON_SYNC_* variables');
  }

  jobs.push(
    cron.schedule(sportsSchedule, () =>
      syncSports().catch(err => logger.error(`CRON sports failed: ${err.message}`)),
    ),
    cron.schedule(eventsSchedule, () =>
      syncEvents().catch(err => logger.error(`CRON events failed: ${err.message}`)),
    ),
    cron.schedule(farSchedule, () =>
      syncOddsForWindow(72, 24 * 30).catch(err => logger.error(`CRON odds(far) failed: ${err.message}`)),
    ),
    cron.schedule(todaySchedule, () =>
      syncOddsForWindow(3, 24).catch(err => logger.error(`CRON odds(today) failed: ${err.message}`)),
    ),
    cron.schedule(soonSchedule, () =>
      syncOddsForWindow(0, 3).catch(err => logger.error(`CRON odds(soon) failed: ${err.message}`)),
    ),
    cron.schedule(scoresSchedule, () =>
      syncScores(1).catch(err => logger.error(`CRON scores failed: ${err.message}`)),
    ),
  );

  logger.info('cronScheduler: enabled');
  logger.info(`  sports: ${sportsSchedule}`);
  logger.info(`  events: ${eventsSchedule}`);
  logger.info(`  odds far: ${farSchedule}`);
  logger.info(`  odds today: ${todaySchedule}`);
  logger.info(`  odds soon: ${soonSchedule}`);
  logger.info(`  scores: ${scoresSchedule}`);
  logger.info(`  sports enabled: ${ENABLED_SPORTS.join(',')}`);

  // Recurring cron jobs are controlled by CRON_RUN. The initial server bootstrap
  // sync is intentionally separate: server.js must populate the local DB on first
  // startup even when CRON_RUN=false. Set CRON_STARTUP_SYNC=false only when a
  // completely offline startup is required.
  const startupSync = String(process.env.CRON_STARTUP_SYNC ?? 'true').toLowerCase() === 'true';
  if (startupSync) {
    void startupSyncIfNeeded().catch(err => logger.error(`startup sync failed: ${err.message}`));
  }
}

function stop() {
  for (const job of jobs) job.stop();
  jobs = [];
}

module.exports = {
  start,
  stop,
  syncAll,
  syncOddsForWindow,
};
