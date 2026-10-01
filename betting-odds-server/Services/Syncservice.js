'use strict';

const { callOddsApi } = require('./Oddsapiclient');
const { resolveCountry } = require('./Countryresolver');
const { getBookmakerPriority, resolveBestOdds } = require('./bookmakerService');
const { Sport, Event, EventMarket, OddsCurrent, OddsHistory, Result } = require('../Models');
const logger = require('../Utils/Logger');

const ENABLED_SPORTS = (process.env.ENABLED_SPORTS || 'soccer_epl')
  .split(',').map(s => s.trim()).filter(Boolean);

const ODDS_REGIONS = process.env.ODDS_REGIONS || 'eu';

// ── Sports ───────────────────────────────────────────────────────────────────
async function syncSports() {
  const data = await callOddsApi('/sports', {});
  let count = 0;
  for (const s of data) {
    await Sport.upsert({
      sportKey: s.key,
      title: s.title,
      groupName: s.group,
      country: resolveCountry(s.key),
      active: s.active,
      enabled: ENABLED_SPORTS.includes(s.key),
      hasOutrights: s.has_outrights,
    });
    count++;
  }
  logger.info(`syncSports: upserted ${count} sports`);
  return count;
}

// ── Events ───────────────────────────────────────────────────────────────────
async function syncEvents(sports = ENABLED_SPORTS) {
  let total = 0;
  for (const sportKey of sports) {
    let data;
    try {
      data = await callOddsApi(`/sports/${sportKey}/events`, { dateFormat: 'iso' });
    } catch (err) {
      logger.error(`syncEvents failed for ${sportKey}: ${err.message}`);
      continue;
    }

    for (const e of data) {
      await Event.upsert({
        eventId: e.id,
        sportKey: e.sport_key,
        homeTeam: e.home_team,
        awayTeam: e.away_team,
        commenceTime: e.commence_time,
        status: 'upcoming',
        lastSyncedAt: new Date(),
      });
      total++;
    }
  }

  logger.info(`syncEvents: upserted ${total} events`);
  return total;
}

// ── Event market discovery ───────────────────────────────────────────────────
/**
 * Discover the markets currently exposed for this event by our configured
 * bookmaker set. The Odds API's event-markets endpoint costs one credit and
 * returns recently seen market keys; more markets can appear as kickoff gets
 * closer.
 */
async function discoverEventMarkets(event) {
  const data = await callOddsApi(
    `/sports/${event.sportKey}/events/${event.eventId}/markets`,
    {
      regions: ODDS_REGIONS,
      dateFormat: 'iso',
    },
  );

  const seen = new Set();

  await EventMarket.update(
    { isAvailable: false },
    { where: { eventId: event.eventId } },
  );

  for (const bookmaker of data?.bookmakers || []) {
    for (const market of bookmaker.markets || []) {
      if (!market.key) continue;
      seen.add(market.key);

      await EventMarket.upsert({
        eventId: event.eventId,
        marketKey: market.key,
        bookmakerKey: bookmaker.key,
        lastUpdate: market.last_update || null,
        lastSeenAt: new Date(),
        isAvailable: true,
      });
    }
  }

  logger.info(
    `discoverEventMarkets: ${event.eventId} -> ${seen.size} market keys`,
  );

  return [...seen];
}

// ── Odds ─────────────────────────────────────────────────────────────────────
/**
 * For each event:
 *   1. Discover currently available market keys.
 *   2. Fetch ALL discovered markets in one event-odds request.
 *   3. Resolve the configured bookmaker priority once.
 *   4. Upsert every returned selection into odds_current.
 *
 * There is intentionally no separate featured/core-market fetch.
 */
async function syncOddsForEvent(event) {
  let markets;
  try {
    markets = await discoverEventMarkets(event);
  } catch (err) {
    logger.error(`syncOddsForEvent market discovery failed for ${event.eventId}: ${err.message}`);
    return { eventId: event.eventId, marketCount: 0, oddsCount: 0, error: err.message };
  }

  if (!markets.length) {
    logger.info(`syncOddsForEvent: no markets reported for ${event.eventId}`);
    return { eventId: event.eventId, marketCount: 0, oddsCount: 0 };
  }

  let raw;
  try {
    raw = await callOddsApi(
      `/sports/${event.sportKey}/events/${event.eventId}/odds`,
      {
        markets: markets.join(','),
        regions: ODDS_REGIONS,
        oddsFormat: 'decimal',
        dateFormat: 'iso',
      },
    );
  } catch (err) {
    logger.error(`syncOddsForEvent odds fetch failed for ${event.eventId}: ${err.message}`);
    return { eventId: event.eventId, marketCount: markets.length, oddsCount: 0, error: err.message };
  }

  const resolved = resolveBestOdds(raw, event.sportKey);
  let updated = 0;

  if (!Object.keys(resolved).length) {
    logger.warn(
      `syncOddsForEvent: upstream returned no usable bookmaker markets for ${event.eventId}`,
    );
    return {
      eventId: event.eventId,
      marketCount: markets.length,
      returnedMarketCount: 0,
      oddsCount: 0,
    };
  }

  // Anything not returned by the latest upstream snapshot is no longer
  // selectable. This prevents stale markets/odds from leaking to the UI.
  await OddsCurrent.update(
    { suspended: true },
    { where: { eventId: event.eventId } },
  );
  const returnedMarketKeys = new Set(Object.keys(resolved));

  for (const [marketKey, marketData] of Object.entries(resolved)) {
    for (const outcome of marketData.outcomes) {
      const where = {
        eventId: event.eventId,
        marketKey,
        outcomeName: outcome.name,
        point: outcome.point ?? null,
        description: outcome.description ?? null,
      };

      const existing = await OddsCurrent.findOne({ where });

      await OddsCurrent.upsert({
        ...where,
        sourcePrice: outcome.rawPrice,
        displayPrice: outcome.price,
        bookmakerKey: marketData.source,
        suspended: false,
        lastUpdate: marketData.lastUpdate,
        fetchedAt: new Date(),
      });

      if (!existing || parseFloat(existing.displayPrice) !== outcome.price) {
        await OddsHistory.create({
          eventId: event.eventId,
          marketKey,
          outcomeName: outcome.name,
          point: outcome.point ?? null,
          price: outcome.price,
          bookmakerKey: marketData.source,
        });
      }

      updated++;
    }
  }

  logger.info(
    `syncOddsForEvent: ${event.eventId} -> discovered=${markets.length}, returned=${returnedMarketKeys.size}, odds=${updated}`,
  );

  return {
    eventId: event.eventId,
    marketCount: markets.length,
    returnedMarketCount: returnedMarketKeys.size,
    oddsCount: updated,
  };
}

async function syncOddsForEvents(events) {
  let updated = 0;
  let markets = 0;

  for (const event of events) {
    const result = await syncOddsForEvent(event);
    updated += result.oddsCount || 0;
    markets += result.marketCount || 0;
  }

  logger.info(
    `syncOddsForEvents: discovered ${markets} market keys and updated ${updated} odds rows across ${events.length} events`,
  );

  return updated;
}

// ── Scores ────────────────────────────────────────────────────────────────────
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
        eventId: s.id,
        homeScore: home ? parseInt(home.score, 10) : null,
        awayScore: away ? parseInt(away.score, 10) : null,
        isFinal: !!s.completed,
        source: 'odds_api_scores',
        settledAt: s.completed ? new Date() : null,
      });

      await Event.update(
        { status: s.completed ? 'finished' : 'live' },
        { where: { eventId: s.id } },
      );
      total++;
    }
  }

  logger.info(`syncScores: upserted ${total} results`);
  return total;
}

module.exports = {
  syncSports,
  syncEvents,
  discoverEventMarkets,
  syncOddsForEvent,
  syncOddsForEvents,
  syncScores,
  ENABLED_SPORTS,
  ODDS_REGIONS,
};
