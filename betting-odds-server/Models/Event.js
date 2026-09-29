'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  eventId:      { type: DataTypes.STRING(64), primaryKey: true, field: 'event_id' },
  sportKey:     { type: DataTypes.STRING(100), allowNull: false, field: 'sport_key' },
  homeTeam:     { type: DataTypes.STRING(150), allowNull: false, field: 'home_team' },
  awayTeam:     { type: DataTypes.STRING(150), allowNull: false, field: 'away_team' },
  commenceTime: { type: DataTypes.DATE,        allowNull: false, field: 'commence_time' },
  status: {
    type: DataTypes.ENUM('upcoming', 'live', 'finished', 'cancelled', 'postponed'),
    defaultValue: 'upcoming',
  },
  lastSyncedAt: { type: DataTypes.DATE, field: 'last_synced_at' },
}, {
  tableName: 'events',
  indexes: [
    { fields: ['sport_key', 'commence_time'] },
    { fields: ['status'] },
  ],
});

module.exports = Event;
