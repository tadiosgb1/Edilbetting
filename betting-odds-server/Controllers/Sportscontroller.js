'use strict';
const { Op }             = require('sequelize');
const { Sport, Event }   = require('../Models');
const { resolveCountry } = require('../services/countryResolver');

/**
 * GET /api/sports
 * All sports/leagues from our DB. Pass ?enabled=true to return only
 * leagues we actively offer.
 */
async function listSports(req, res) {
  const where = {};
  if (req.query.enabled === 'true')  where.enabled = true;
  if (req.query.enabled === 'false') where.enabled = false;

  const sports = await Sport.findAll({ where, order: [['sortOrder', 'ASC'], ['title', 'ASC']] });
  res.json({ success: true, count: sports.length, data: sports });
}

/**
 * GET /api/sports/types
 * Unique sport type groups (Soccer, Basketball, Tennis …) with counts.
 */
async function listSportTypes(req, res) {
  const sports = await Sport.findAll({ where: { active: true }, attributes: ['groupName'] });
  const map    = {};
  sports.forEach(s => {
    const grp = s.groupName || 'Other';
    if (!map[grp]) map[grp] = { key: grp.toLowerCase().replace(/\s+/g, '_'), name: grp, leagueCount: 0 };
    map[grp].leagueCount++;
  });
  const types = Object.values(map).sort((a, b) => b.leagueCount - a.leagueCount);
  res.json({ success: true, count: types.length, data: types });
}

/**
 * GET /api/sports/top-leagues
 * Curated featured leagues — enabled ones first, then active.
 */
async function listTopLeagues(req, res) {
  const TOP_KEYS = [
    'soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga',
    'soccer_italy_serie_a', 'soccer_france_ligue_one', 'soccer_uefa_champs_league',
    'basketball_nba', 'americanfootball_nfl', 'tennis_atp_french_open', 'cricket_ipl',
  ];
  const sports = await Sport.findAll({ where: { sportKey: { [Op.in]: TOP_KEYS } } });
  // Return in the TOP_KEYS order
  const ordered = TOP_KEYS.map(k => sports.find(s => s.sportKey === k)).filter(Boolean);
  // If fewer than 5 matched, pad with other active enabled sports
  if (ordered.length < 5) {
    const extra = await Sport.findAll({
      where: { enabled: true, sportKey: { [Op.notIn]: TOP_KEYS } },
      limit: 10 - ordered.length,
    });
    ordered.push(...extra);
  }
  res.json({ success: true, count: ordered.length, data: ordered });
}

/**
 * GET /api/sports/:sportType/countries
 * Countries that have leagues for a given sport type, derived from our DB.
 */
async function listCountriesForSportType(req, res) {
  const { sportType } = req.params;
  const sports = await Sport.findAll({
    where: { sportKey: { [Op.like]: `${sportType}%` }, active: true },
  });

  const map = {};
  sports.forEach(s => {
    const country = s.country || resolveCountry(s.sportKey);
    const code    = country.toLowerCase().replace(/[\s/]+/g, '_');
    if (!map[code]) map[code] = { code, name: country, leagueCount: 0, leagues: [] };
    map[code].leagueCount++;
    map[code].leagues.push({ sportKey: s.sportKey, title: s.title });
  });

  const countries = Object.values(map).sort((a, b) => b.leagueCount - a.leagueCount);
  res.json({ success: true, sportType, count: countries.length, data: countries });
}

/**
 * GET /api/sports/:sportType/countries/:countryCode/leagues
 * Leagues for a specific country within a sport type.
 */
async function listLeaguesForCountry(req, res) {
  const { sportType, countryCode } = req.params;
  const targetCountry = countryCode.replace(/_/g, ' ');

  const sports = await Sport.findAll({
    where: {
      sportKey: { [Op.like]: `${sportType}%` },
      active:   true,
    },
  });

  const leagues = sports
    .filter(s => {
      const c = (s.country || resolveCountry(s.sportKey)).toLowerCase().replace(/[\s/]+/g, '_');
      return c === countryCode.toLowerCase();
    })
    .map(s => ({
      sportKey:    s.sportKey,
      title:       s.title,
      country:     s.country || targetCountry,
      enabled:     s.enabled,
      hasOutrights:s.hasOutrights,
    }));

  res.json({ success: true, sportType, countryCode, count: leagues.length, data: leagues });
}

module.exports = {
  listSports,
  listSportTypes,
  listTopLeagues,
  listCountriesForSportType,
  listLeaguesForCountry,
};
