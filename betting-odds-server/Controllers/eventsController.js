'use strict';
const { Op }    = require('sequelize');
const { Event, Sport, OddsCurrent } = require('../Models');

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

    // Temporary odds fallback: persist generated 1X2 prices in odds_current so
    // the /bets endpoint can lock the exact same odds when the player books.
    const randomOdd = () => Number((1.01 + Math.random() * (6 - 1.01)).toFixed(2));
    const createFallback = async (outcomeName) => {
      const price = randomOdd();
      return OddsCurrent.create({
        eventId: json.eventId,
        marketKey: 'h2h',
        outcomeName,
        point: null,
        description: null,
        sourcePrice: price,
        displayPrice: price,
        bookmakerKey: 'temporary_random',
        suspended: false,
        lastUpdate: new Date(),
        fetchedAt: new Date(),
      });
    };

    if (!homeRow) {
      homeRow = await createFallback(json.homeTeam);
    }
    if (!drawRow) {
      drawRow = await createFallback('Draw');
    }
    if (!awayRow) {
      awayRow = await createFallback(json.awayTeam);
    }

    return {
      ...json,
      odds: {
        home: Number(homeRow.displayPrice),
        draw: Number(drawRow.displayPrice),
        away: Number(awayRow.displayPrice),
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

module.exports = { listEvents, listTodayEvents, listLiveEvents, getEvent };
