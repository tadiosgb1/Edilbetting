// Pinnacle-first fallback chain, as discussed: Pinnacle is treated as the
// sharpest/lowest-margin reference book. If it doesn't cover a market for a
// given match, fall through to the next trusted bookmaker in the list.
// Markets no priority bookmaker has are simply omitted — never silently
// filled from a random thin/unreliable book.
const BOOKMAKER_PRIORITY = {
  default: ['pinnacle', 'williamhill', 'onexbet', 'betfair_ex_eu'],
  soccer_epl: ['pinnacle', 'williamhill', 'onexbet', 'betfair_ex_eu'],
  soccer_spain_la_liga: ['pinnacle', 'williamhill', 'onexbet'],
  soccer_germany_bundesliga: ['pinnacle', 'williamhill', 'onexbet'],
  soccer_italy_serie_a: ['pinnacle', 'williamhill', 'onexbet'],
  soccer_france_ligue_one: ['pinnacle', 'williamhill', 'onexbet'],
};

function getBookmakerPriority(sportKey) {
  return BOOKMAKER_PRIORITY[sportKey] || BOOKMAKER_PRIORITY.default;
}

/** Apply a house margin to a decimal price. Flat-percentage version — good
 *  enough to start; a proper implementation redistributes margin across
 *  outcomes so implied probabilities sum sensibly. Revisit before scaling. */
function applyMargin(price, marginPct) {
  const pct = marginPct ?? parseFloat(process.env.DEFAULT_MARGIN_PCT || '6');
  const shaded = price * (1 - pct / 100);
  return Math.round(shaded * 100) / 100;
}

/** For ONE event's raw odds response (The Odds API shape), resolve each
 *  market down to a single bookmaker's outcome list, following the
 *  priority chain, and apply the house margin. Returns a flat map:
 *  { [marketKey]: { source, lastUpdate, outcomes: [...] } } */
function resolveBestOdds(eventData, sportKey, marginPct) {
  const priority = getBookmakerPriority(sportKey);
  const resolved = {};

  for (const bookKey of priority) {
    const book = eventData.bookmakers?.find(b => b.key === bookKey);
    if (!book) continue;
    for (const market of book.markets) {
      if (resolved[market.key]) continue; // already filled by a higher-priority book
      resolved[market.key] = {
        source: bookKey,
        lastUpdate: market.last_update,
        outcomes: market.outcomes.map(o => ({
          ...o,
          price: applyMargin(o.price, marginPct),
          rawPrice: o.price,
        })),
      };
    }
  }
  return resolved;
}

module.exports = { getBookmakerPriority, applyMargin, resolveBestOdds, BOOKMAKER_PRIORITY };