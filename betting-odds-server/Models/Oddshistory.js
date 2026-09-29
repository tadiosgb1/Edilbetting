'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Only insert a row when a price actually CHANGES — not on every refresh.
const OddsHistory = sequelize.define('OddsHistory', {
  id:           { type: DataTypes.BIGINT,      primaryKey: true, autoIncrement: true },
  eventId:      { type: DataTypes.STRING(64),  allowNull: false, field: 'event_id' },
  marketKey:    { type: DataTypes.STRING(100), allowNull: false, field: 'market_key' },
  outcomeName:  { type: DataTypes.STRING(150), allowNull: false, field: 'outcome_name' },
  point:        { type: DataTypes.DECIMAL(6,2) },
  price:        { type: DataTypes.DECIMAL(8,3), allowNull: false },
  bookmakerKey: { type: DataTypes.STRING(60),  allowNull: false, field: 'bookmaker_key' },
  recordedAt:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'recorded_at' },
}, {
  tableName:  'odds_history',
  timestamps: false,
  indexes: [{ fields: ['event_id', 'market_key', 'recorded_at'] }],
});

module.exports = OddsHistory;
