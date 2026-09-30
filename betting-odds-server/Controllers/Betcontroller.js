'use strict';
const { sequelize, Bet, BetSelection, OddsCurrent, Event } = require('../Models');

/**
 * POST /api/bets
 * Body: { userId, stake, selections: [{ eventId, marketKey, outcomeName, point? }] }
 *
 * Re-reads CURRENT price from odds_current for each selection (never trusts
 * a client-supplied price) and locks it as odds_at_bet. The bet is created
 * with status=pending without requiring or debiting wallet balance; funding
 * and payment approval are handled separately.
 */
async function placeBet(req, res) {
  const { userId, stake, selections } = req.body;

  if (!userId || !stake || stake <= 0 || !Array.isArray(selections) || !selections.length) {
    return res.status(400).json({
      success: false,
      error:   'userId, a positive stake, and at least one selection are required.',
    });
  }

  const result = await sequelize.transaction(async (t) => {
    let totalOdds = 1;
    const resolved = [];

    for (const sel of selections) {
      const event = await Event.findByPk(sel.eventId, { transaction: t });
      if (!event)
        throw Object.assign(new Error(`Event ${sel.eventId} not found`), { statusCode: 404 });
      if (event.status !== 'upcoming')
        throw Object.assign(
          new Error(`Event ${sel.eventId} is not open for betting (status: ${event.status})`),
          { statusCode: 400 }
        );
      if (new Date() >= new Date(event.commenceTime))
        throw Object.assign(new Error(`Event ${sel.eventId} has already started`), { statusCode: 400 });

      const odds = await OddsCurrent.findOne({
        where: {
          eventId:     sel.eventId,
          marketKey:   sel.marketKey,
          outcomeName: sel.outcomeName,
          point:       sel.point ?? null,
          suspended:   false,
        },
        transaction: t,
      });
      if (!odds)
        throw Object.assign(
          new Error(`No active odds for ${sel.marketKey}/${sel.outcomeName} on event ${sel.eventId}`),
          { statusCode: 400 }
        );

      const price = parseFloat(odds.displayPrice);
      totalOdds  *= price;
      resolved.push({ ...sel, oddsAtBet: price });
    }

    totalOdds      = Math.round(totalOdds * 10000) / 10000;
    const payout   = Math.round(stake * totalOdds * 100) / 100;

    const bet = await Bet.create(
      { userId, stake, totalOdds, potentialPayout: payout, status: 'pending' },
      { transaction: t }
    );

    for (const sel of resolved) {
      await BetSelection.create({
        betId:       bet.betId,
        eventId:     sel.eventId,
        marketKey:   sel.marketKey,
        outcomeName: sel.outcomeName,
        point:       sel.point ?? null,
        oddsAtBet:   sel.oddsAtBet,
      }, { transaction: t });
    }

    return bet;
  });

  res.status(201).json({ success: true, message: 'Bet saved as pending. Payment is not confirmed.', data: result });
}

/** GET /api/bets/:userId — bet history for a user */
async function getBetsForUser(req, res) {
  const bets = await Bet.findAll({
    where:   { userId: req.params.userId },
    include: [{
      association: 'selections',
      include: [{ model: Event, attributes: ['eventId', 'homeTeam', 'awayTeam', 'commenceTime', 'sportKey'] }],
    }],
    order:   [['placedAt', 'DESC']],
  });
  res.json({ success: true, count: bets.length, data: bets });
}

/** GET /api/bets/:userId/:betId — single bet detail */
async function getBetById(req, res) {
  const bet = await Bet.findOne({
    where:   { betId: req.params.betId, userId: req.params.userId },
    include: [{
      association: 'selections',
      include: [{ model: Event, attributes: ['eventId', 'homeTeam', 'awayTeam', 'commenceTime', 'sportKey'] }],
    }],
  });
  if (!bet) return res.status(404).json({ success: false, error: 'Bet not found.' });
  res.json({ success: true, data: bet });
}

/**
 * POST /api/bets/:userId/:betId/cancel
 *
 * A player may cancel only their own pending bet. The row is locked inside
 * a transaction so an approval/settlement cannot race the cancellation.
 * Pending bets do not debit the wallet at placement, so cancellation does
 * not create a wallet refund.
 */
async function cancelBet(req, res) {
  const { userId, betId } = req.params;

  const cancelledBet = await sequelize.transaction(async (t) => {
    const bet = await Bet.findOne({
      where: { betId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!bet) {
      throw Object.assign(new Error('Bet not found.'), { statusCode: 404 });
    }

    if (bet.status !== 'pending') {
      throw Object.assign(
        new Error('Only pending bets can be cancelled.'),
        { statusCode: 409 }
      );
    }

    bet.status = 'cancelled';
    bet.settledAt = new Date();
    await bet.save({ transaction: t });

    return bet;
  });

  res.json({
    success: true,
    message: 'Bet cancelled successfully.',
    data: cancelledBet,
  });
}

module.exports = { placeBet, getBetsForUser, getBetById, cancelBet };
