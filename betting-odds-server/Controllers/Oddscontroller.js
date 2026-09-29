'use strict';
const { OddsCurrent, Event } = require('../models');

/**
 * GET /api/odds/:eventId
 * All current (non-suspended) odds for one event, grouped by market key.
 * Served entirely from our DB — never triggers an upstream call.
 * Optional ?markets=h2h,totals  to filter to specific markets.
 */
async function getOddsForEvent(req, res) {
  const { eventId } = req.params;
  const where = { eventId, suspended: false };
  if (req.query.markets) {
    where.marketKey = req.query.markets.split(',').map(m => m.trim());
  }

  const [rows, event] = await Promise.all([
    OddsCurrent.findAll({ where }),
    Event.findByPk(eventId),
  ]);

  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });

  // Group outcomes by market key
  const grouped = {};
  rows.forEach(r => {
    if (!grouped[r.marketKey]) grouped[r.marketKey] = [];
    grouped[r.marketKey].push({
      name:        r.outcomeName,
      price:       parseFloat(r.displayPrice),
      point:       r.point       !== null ? parseFloat(r.point) : undefined,
      description: r.description || undefined,
      source:      r.bookmakerKey,
      lastUpdate:  r.lastUpdate,
    });
  });

  res.json({
    success: true,
    eventId,
    event: {
      homeTeam:     event.homeTeam,
      awayTeam:     event.awayTeam,
      commenceTime: event.commenceTime,
      status:       event.status,
    },
    markets: grouped,
  });
}

module.exports = { getOddsForEvent };
