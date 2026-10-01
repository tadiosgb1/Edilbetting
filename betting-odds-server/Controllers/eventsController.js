'use strict';
const { Op }    = require('sequelize');
const { Event, Sport, EventMarket, OddsCurrent } = require('../Models');
const { syncOddsForEvent, syncEvents } = require('../Services/Syncservice');

/**
 * GET /api/events/:sportKey
 * List events from our DB. Supports ?from, ?to (ISO date), ?status.
 */
async function listEvents(req, res) {
  const { sportKey } = req.params;
  const where = { sportKey };

  if (req.query.status) where.status = req.query.status;
  if (req.query.from || req.query.to) {
    where.commenceTime = {};
    if (req.query.from) where.commenceTime[Op.gte] = new Date(req.query.from);
    if (req.query.to)   where.commenceTime[Op.lte] = new Date(req.query.to);
  }

  const events = await Event.findAll({
    where,
    include: [
      { model: Sport, attributes: ['title', 'country'] },
      {
        model: OddsCurrent,
        as: 'odds',
        attributes: ['marketKey', 'outcomeName', 'point', 'displayPrice', 'suspended'],
        where: { suspended: false },
        required: false,
      },
    ],
    order:   [['commenceTime', 'ASC']],
  });
  const data = await Promise.all(events.map(async (event) => {
    const json = event.toJSON();
    const rows = Array.isArray(json.odds) ? json.odds : [];
    const h2h = rows.filter((row) => row.marketKey === 'h2h' && !row.suspended);

    const findOutcome = (teamName, fallbackName) =>
      h2h.find((row) => row.outcomeName === teamName || row.outcomeName === fallbackName);

    let homeRow = findOutcome(json.homeTeam, 'Home');
    let drawRow = findOutcome(null, 'Draw');
    let awayRow = findOutcome(json.awayTeam, 'Away');

    const homeOdd = homeRow ? Number(homeRow.displayPrice) : null;
    const drawOdd = drawRow ? Number(drawRow.displayPrice) : null;
    const awayOdd = awayRow ? Number(awayRow.displayPrice) : null;

    return {
      ...json,
      odds: {
        home: homeOdd,
        draw: drawOdd,
        away: awayOdd,
      },
    };
  }));
  res.json({ success: true, sportKey, count: data.length, data });
}

/**
 * GET /api/events/:sportKey/today
 * Convenience — events whose commenceTime falls in today's UTC day.
 */
async function listTodayEvents(req, res) {
  const { sportKey } = req.params;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const events = await Event.findAll({
    where: {
      sportKey,
      commenceTime: { [Op.between]: [start, end] },
    },
    include: [{ model: Sport, attributes: ['title', 'country'] }],
    order:   [['commenceTime', 'ASC']],
  });
  res.json({ success: true, sportKey, count: events.length, data: events });
}

/**
 * GET /api/events/:sportKey/live
 * Events currently marked as live.
 */
async function listLiveEvents(req, res) {
  const { sportKey } = req.params;
  const events = await Event.findAll({
    where: { sportKey, status: 'live' },
    include: [{ model: OddsCurrent, as: 'odds', where: { suspended: false }, required: false }],
    order:   [['commenceTime', 'ASC']],
  });
  res.json({ success: true, sportKey, count: events.length, data: events });
}




/**
 * POST /api/events/:sportKey/sync-events
 * Refresh the local event list from the free upstream events endpoint.
 */
async function syncSportEventsNow(req, res) {
  if (String(process.env.ODDS_MANUAL_SYNC || '').toLowerCase() !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Manual odds sync is disabled. Set ODDS_MANUAL_SYNC=true for controlled testing.',
    });
  }

  const { sportKey } = req.params;
  try {
    const count = await syncEvents([sportKey]);
    const events = await Event.findAll({
      where: { sportKey },
      order: [['commenceTime', 'ASC']],
    });
    res.json({ success: true, sportKey, synced: count, count: events.length, data: events });
  } finally {
    // no process-wide environment mutation
  }
}

/**
 * POST /api/events/:sportKey/:eventId/sync
 * One-event manual sync for controlled Postman/sandbox testing.
 * Disabled unless ODDS_MANUAL_SYNC=true.
 */
async function syncEventNow(req, res) {
  if (String(process.env.ODDS_MANUAL_SYNC || '').toLowerCase() !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Manual odds sync is disabled. Set ODDS_MANUAL_SYNC=true for controlled testing.',
    });
  }

  const { sportKey, eventId } = req.params;
  let event = await Event.findOne({ where: { eventId, sportKey } });
  if (!event) {
    // /events is a free upstream endpoint, so this does not spend odds quota.
    await syncEvents();
    event = await Event.findOne({ where: { eventId, sportKey } });
  }
  if (!event) return res.status(404).json({ success: false, error: 'Event not found after refreshing events.' });

  const result = await syncOddsForEvent(event);
  res.json({ success: true, data: result });
}

/**
 * GET /api/events/:sportKey/:eventId/markets
 * Market keys discovered and persisted for this event.
 */
async function getEventMarkets(req, res) {
  const { sportKey, eventId } = req.params;
  const event = await Event.findOne({ where: { eventId, sportKey } });
  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });

  const markets = await EventMarket.findAll({
    where: { eventId, isAvailable: true },
    order: [['marketKey', 'ASC'], ['bookmakerKey', 'ASC']],
  });

  const grouped = {};
  for (const row of markets) {
    if (!grouped[row.marketKey]) grouped[row.marketKey] = [];
    grouped[row.marketKey].push({
      bookmakerKey: row.bookmakerKey,
      lastUpdate: row.lastUpdate,
      lastSeenAt: row.lastSeenAt,
    });
  }

  res.json({
    success: true,
    eventId,
    sportKey,
    count: Object.keys(grouped).length,
    markets: grouped,
  });
}

/**
 * GET /api/events/:sportKey/:eventId/markets-with-odds
 * Available markets for one event plus the current DB odds for those markets.
 * This endpoint never calls the upstream provider.
 */
async function getEventMarketsWithOdds(req, res) {
  const { sportKey, eventId } = req.params;
  const event = await Event.findOne({ where: { eventId, sportKey } });
  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });

  const [marketRows, oddsRows] = await Promise.all([
    EventMarket.findAll({
      where: { eventId, isAvailable: true },
      order: [['marketKey', 'ASC'], ['bookmakerKey', 'ASC']],
    }),
    OddsCurrent.findAll({
      where: { eventId, suspended: false },
      order: [['marketKey', 'ASC'], ['outcomeName', 'ASC']],
    }),
  ]);

  const available = new Set(marketRows.map(row => row.marketKey));
  const grouped = {};
  for (const row of oddsRows) {
    if (!available.has(row.marketKey)) continue;
    if (!grouped[row.marketKey]) grouped[row.marketKey] = [];
    grouped[row.marketKey].push({
      name: row.outcomeName,
      price: Number(row.displayPrice),
      point: row.point !== null ? Number(row.point) : null,
      description: row.description || null,
      source: row.bookmakerKey,
      lastUpdate: row.lastUpdate,
    });
  }

  res.json({
    success: true,
    eventId,
    sportKey,
    availableMarketCount: available.size,
    markets: grouped,
  });
}

/**
 * GET /api/events/:sportKey/:eventId
 * Single event by ID with its current odds.
 */
async function getEvent(req, res) {
  const { sportKey, eventId } = req.params;
  const event = await Event.findOne({
    where:   { eventId, sportKey },
    include: [
      { model: Sport,       attributes: ['title', 'country'] },
      { model: OddsCurrent, as: 'odds', where: { suspended: false }, required: false },
    ],
  });
  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });
  res.json({ success: true, data: event });
}

module.exports = { listEvents, listTodayEvents, listLiveEvents, syncSportEventsNow, syncEventNow, getEventMarkets, getEventMarketsWithOdds, getEvent };
