'use strict';

// Pinnacle-first fallback chain. Pinnacle is the sharpest / lowest-margin
// reference book. If it doesn't cover a market we fall through the list.
// Markets no priority bookmaker carries are simply omitted.
const BOOKMAKER_PRIORITY = {
  default:                    ['pinnacle', 'williamhill', 'onexbet', 'betfair_ex_eu'],
  soccer_epl:                 ['pinnacle', 'williamhill', 'onexbet', 'betfair_ex_eu'],
  soccer_spain_la_liga:       ['pinnacle', 'williamhill', 'onexbet'],
  soccer_germany_bundesliga:  ['pinnacle', 'williamhill', 'onexbet'],
  soccer_italy_serie_a:       ['pinnacle', 'williamhill', 'onexbet'],
  soccer_france_ligue_one:    ['pinnacle', 'williamhill', 'onexbet'],
  soccer_uefa_champs_league:  ['pinnacle', 'williamhill', 'onexbet'],
};

function getBookmakerPriority(sportKey) {
  return BOOKMAKER_PRIORITY[sportKey] || BOOKMAKER_PRIORITY.default;
}

/**
 * Apply a flat house margin to a decimal price.
 * price * (1 - margin/100) — rounds to 2 dp.
 */
function applyMargin(price, marginPct) {
  const pct    = marginPct ?? parseFloat(process.env.DEFAULT_MARGIN_PCT || '6');
  const shaded = price * (1 - pct / 100);
  return Math.round(shaded * 100) / 100;
}

/**
 * For one raw Odds API event response, reduce every market to a single
 * bookmaker's outcome list following the priority chain, then apply margin.
 * Returns: { [marketKey]: { source, lastUpdate, outcomes: [...] } }
 */
function resolveBestOdds(eventData, sportKey, marginPct) {
  const priority = getBookmakerPriority(sportKey);
  const resolved = {};

  const bookmakers = eventData.bookmakers || [];
  const ordered = [
    ...priority.map(key => bookmakers.find(b => b.key === key)).filter(Boolean),
    ...bookmakers.filter(book => !priority.includes(book.key)),
  ];

  for (const book of ordered) {
    for (const market of book.markets || []) {
      if (resolved[market.key]) continue;
      if (!Array.isArray(market.outcomes) || !market.outcomes.length) continue;

      resolved[market.key] = {
        source:     book.key,
        lastUpdate: market.last_update,
        outcomes:   market.outcomes
          .filter(o => o && o.name != null && Number.isFinite(Number(o.price)))
          .map(o => ({
            ...o,
            price:    applyMargin(Number(o.price), marginPct),
            rawPrice: Number(o.price),
          })),
      };
    }
  }
  return resolved;
}

module.exports = { BOOKMAKER_PRIORITY, getBookmakerPriority, applyMargin, resolveBestOdds };
