'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Result = sequelize.define('Result', {
  eventId:      { type: DataTypes.STRING(64), primaryKey: true, field: 'event_id' },
  homeScore:    { type: DataTypes.INTEGER, field: 'home_score' },
  awayScore:    { type: DataTypes.INTEGER, field: 'away_score' },
  homeScoreH1:  { type: DataTypes.INTEGER, field: 'home_score_h1' },
  awayScoreH1:  { type: DataTypes.INTEGER, field: 'away_score_h1' },
  totalCorners: { type: DataTypes.INTEGER, field: 'total_corners' },
  totalCards:   { type: DataTypes.INTEGER, field: 'total_cards' },
  isFinal:      { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_final' },
  source:       { type: DataTypes.STRING(30), defaultValue: 'odds_api_scores' },
  settledAt:    { type: DataTypes.DATE, field: 'settled_at' },
}, {
  tableName:  'results',
  updatedAt:  false,
});

module.exports = Result;
