'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// oddsAtBet is locked at placement time — never recalculate from odds_current.
const BetSelection = sequelize.define('BetSelection', {
  id:          { type: DataTypes.BIGINT,     primaryKey: true, autoIncrement: true },
  betId:       { type: DataTypes.CHAR(36),   allowNull: false, field: 'bet_id' },
  eventId:     { type: DataTypes.STRING(64), allowNull: false, field: 'event_id' },
  marketKey:   { type: DataTypes.STRING(100), allowNull: false, field: 'market_key' },
  outcomeName: { type: DataTypes.STRING(150), allowNull: false, field: 'outcome_name' },
  point:       { type: DataTypes.DECIMAL(6,2) },
  oddsAtBet:   { type: DataTypes.DECIMAL(10,4), allowNull: false, field: 'odds_at_bet' },
  result: {
    type: DataTypes.ENUM('pending', 'won', 'lost', 'void'),
    defaultValue: 'pending',
  },
}, {
  tableName:  'bet_selections',
  timestamps: false,
  indexes:    [{ fields: ['event_id'] }],
});

module.exports = BetSelection;
