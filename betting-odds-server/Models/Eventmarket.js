'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventMarket = sequelize.define('EventMarket', {
  id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  eventId:     { type: DataTypes.STRING(64), allowNull: false, field: 'event_id' },
  marketKey:   { type: DataTypes.STRING(100), allowNull: false, field: 'market_key' },
  bookmakerKey:{ type: DataTypes.STRING(60), allowNull: false, field: 'bookmaker_key' },
  lastUpdate:  { type: DataTypes.DATE, field: 'last_update' },
  lastSeenAt:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'last_seen_at' },
  isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_available' },
}, {
  tableName: 'event_markets',
  updatedAt: false,
  createdAt: false,
  indexes: [
    { fields: ['event_id', 'market_key'] },
    { fields: ['event_id', 'bookmaker_key'] },
    {
      unique: true,
      fields: ['event_id', 'market_key', 'bookmaker_key'],
      name: 'uniq_event_market_bookmaker',
    },
  ],
});

module.exports = EventMarket;
