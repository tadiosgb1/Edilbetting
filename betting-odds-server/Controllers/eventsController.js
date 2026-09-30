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
  const data = events.map((event) => {
    const json = event.toJSON();
    const rows = Array.isArray(json.odds) ? json.odds : [];
    const h2h = rows.filter((row) => row.marketKey === 'h2h' && !row.suspended);
    const homeRow = h2h.find((row) => row.outcomeName === json.homeTeam || row.outcomeName === 'Home');
    const drawRow = h2h.find((row) => row.outcomeName === 'Draw');
    const awayRow = h2h.find((row) => row.outcomeName === json.awayTeam || row.outcomeName === 'Away');
    return {
      ...json,
      odds: {
        home: homeRow ? Number(homeRow.displayPrice) : null,
        draw: drawRow ? Number(drawRow.displayPrice) : null,
        away: awayRow ? Number(awayRow.displayPrice) : null,
      },
    };
  });
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
