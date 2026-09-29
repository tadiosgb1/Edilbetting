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

  for (const bookKey of priority) {
    const book = (eventData.bookmakers || []).find(b => b.key === bookKey);
    if (!book) continue;
    for (const market of book.markets || []) {
      if (resolved[market.key]) continue; // already filled by higher-priority book
      resolved[market.key] = {
        source:     bookKey,
        lastUpdate: market.last_update,
        outcomes:   (market.outcomes || []).map(o => ({
          ...o,
          price:    applyMargin(o.price, marginPct),
          rawPrice: o.price,
        })),
      };
    }
  }
  return resolved;
}

module.exports = { BOOKMAKER_PRIORITY, getBookmakerPriority, applyMargin, resolveBestOdds };
