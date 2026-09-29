'use strict';
const { callOddsApi }        = require('./oddsApiClient');
const { resolveCountry }     = require('./countryResolver');
const { getBookmakerPriority, resolveBestOdds } = require('./bookmakerService');
const { Sport, Event, OddsCurrent, OddsHistory, Result } = require('../models');
const logger = require('../utils/logger');

const ENABLED_SPORTS = (process.env.ENABLED_SPORTS || 'soccer_epl')
  .split(',').map(s => s.trim()).filter(Boolean);

// ── Sports ───────────────────────────────────────────────────────────────────
/**
 * Pulls /sports (free) and upserts into the sports table.
 * Enables only leagues in ENABLED_SPORTS — everything else is stored but
 * inactive, so switching leagues on later needs no extra fetch.
 */
async function syncSports() {
  const data = await callOddsApi('/sports', {});
  let count = 0;
  for (const s of data) {
    await Sport.upsert({
      sportKey:    s.key,
      title:       s.title,
      groupName:   s.group,
      country:     resolveCountry(s.key),
      active:      s.active,
      enabled:     ENABLED_SPORTS.includes(s.key),
      hasOutrights:s.has_outrights,
    });
    count++;
  }
  logger.info(`syncSports: upserted ${count} sports`);
  return count;
}

// ── Events ───────────────────────────────────────────────────────────────────
/** Pulls /events (free) for each enabled sport and upserts into events. */
async function syncEvents() {
  let total = 0;
  for (const sportKey of ENABLED_SPORTS) {
    let data;
    try {
      data = await callOddsApi(`/sports/${sportKey}/events`, { dateFormat: 'iso' });
    } catch (err) {
      logger.error(`syncEvents failed for ${sportKey}: ${err.message}`);
      continue;
    }
    for (const e of data) {
      await Event.upsert({
        eventId:      e.id,
        sportKey:     e.sport_key,
        homeTeam:     e.home_team,
        awayTeam:     e.away_team,
        commenceTime: e.commence_time,
        status:       'upcoming',
        lastSyncedAt: new Date(),
      });
      total++;
    }
  }
  logger.info(`syncEvents: upserted ${total} events`);
  return total;
}

// ── Odds ─────────────────────────────────────────────────────────────────────
/**
 * Pull odds for a list of Event model instances, write into odds_current
 * (upsert) and odds_history (only on real price change).
 */
async function syncOddsForEvents(events, markets) {
  let updated = 0;
  for (const event of events) {
    const priority = getBookmakerPriority(event.sportKey);
    let raw;
    try {
      raw = await callOddsApi(`/sports/${event.sportKey}/events/${event.eventId}/odds`, {
        markets,
        bookmakers:  priority.join(','),
        oddsFormat:  'decimal',
        dateFormat:  'iso',
      });
    } catch (err) {
      logger.error(`syncOddsForEvents failed for ${event.eventId}: ${err.message}`);
      continue;
    }

    const resolved = resolveBestOdds(raw, event.sportKey);

    for (const [marketKey, marketData] of Object.entries(resolved)) {
      for (const outcome of marketData.outcomes) {
        const where = {
          eventId:     event.eventId,
          marketKey,
          outcomeName: outcome.name,
          point:       outcome.point       ?? null,
          description: outcome.description ?? null,
        };

        const existing = await OddsCurrent.findOne({ where });

        await OddsCurrent.upsert({
          ...where,
          sourcePrice:  outcome.rawPrice,
          displayPrice: outcome.price,
          bookmakerKey: marketData.source,
          suspended:    false,
          lastUpdate:   marketData.lastUpdate,
          fetchedAt:    new Date(),
        });

        // Only append history row when the displayed price actually changed
        if (!existing || parseFloat(existing.displayPrice) !== outcome.price) {
          await OddsHistory.create({
            eventId:     event.eventId,
            marketKey,
            outcomeName: outcome.name,
            point:       outcome.point ?? null,
            price:       outcome.price,
            bookmakerKey:marketData.source,
          });
        }
        updated++;
      }
    }
  }
  logger.info(`syncOddsForEvents: updated ${updated} odds rows across ${events.length} events`);
  return updated;
}

// ── Scores ────────────────────────────────────────────────────────────────────
/** Pulls /scores for each enabled sport and writes into results table. */
async function syncScores(daysFrom) {
  let total = 0;
  for (const sportKey of ENABLED_SPORTS) {
    let data;
    try {
      data = await callOddsApi(`/sports/${sportKey}/scores`, {
        dateFormat: 'iso',
        ...(daysFrom && { daysFrom }),
      });
    } catch (err) {
      logger.error(`syncScores failed for ${sportKey}: ${err.message}`);
      continue;
    }
    for (const s of data) {
      if (!s.completed && !s.scores) continue;
      const home = s.scores?.find(sc => sc.name === s.home_team);
      const away = s.scores?.find(sc => sc.name === s.away_team);

      await Result.upsert({
        eventId:   s.id,
        homeScore: home ? parseInt(home.score, 10) : null,
        awayScore: away ? parseInt(away.score, 10) : null,
        isFinal:   !!s.completed,
        source:    'odds_api_scores',
        settledAt: s.completed ? new Date() : null,
      });

      await Event.update(
        { status: s.completed ? 'finished' : 'live' },
        { where: { eventId: s.id } }
      );
      total++;
    }
  }
  logger.info(`syncScores: upserted ${total} results`);
  return total;
}

module.exports = { syncSports, syncEvents, syncOddsForEvents, syncScores, ENABLED_SPORTS };
