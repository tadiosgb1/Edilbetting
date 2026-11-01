'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OddsCurrent = sequelize.define('OddsCurrent', {
  id:           { type: DataTypes.BIGINT,       primaryKey: true, autoIncrement: true },
  eventId:      { type: DataTypes.STRING(64),   allowNull: false, field: 'event_id' },
  marketKey:    { type: DataTypes.STRING(100),  allowNull: false, field: 'market_key' },
  outcomeName:  { type: DataTypes.STRING(150),  allowNull: false, field: 'outcome_name' },
  point:        { type: DataTypes.DECIMAL(6,2) },
  description:  { type: DataTypes.STRING(150) },
  sourcePrice:  { type: DataTypes.DECIMAL(8,3), allowNull: false, field: 'source_price' },
  displayPrice: { type: DataTypes.DECIMAL(8,3), allowNull: false, field: 'display_price' },
  bookmakerKey: { type: DataTypes.STRING(60),   allowNull: false, field: 'bookmaker_key' },
  suspended:    { type: DataTypes.BOOLEAN, defaultValue: false },
  lastUpdate:   { type: DataTypes.DATE, field: 'last_update' },
  fetchedAt:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'fetched_at' },
}, {
  tableName:  'odds_current',
  updatedAt:  false,
  createdAt:  false,
  indexes: [
    { fields: ['event_id', 'market_key'] },
    {
      unique: true,
      fields: ['event_id', 'market_key', 'outcome_name', 'point', 'description'],
      name:   'uniq_odds_selection',
    },
  ],
});

module.exports = OddsCurrent;
