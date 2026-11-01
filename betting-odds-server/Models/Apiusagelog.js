'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Every call to The Odds API upstream gets a row here so you can track
// credit consumption over time via GET /api/admin/usage.
const ApiUsageLog = sequelize.define('ApiUsageLog', {
  id:                { type: DataTypes.BIGINT,      primaryKey: true, autoIncrement: true },
  endpoint:          { type: DataTypes.STRING(255), allowNull: false },
  paramsJson:        { type: DataTypes.JSON,        field: 'params_json' },
  creditsUsed:       { type: DataTypes.INTEGER,     field: 'credits_used' },
  requestsRemaining: { type: DataTypes.INTEGER,     field: 'requests_remaining' },
  calledAt:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'called_at' },
}, {
  tableName:  'api_usage_log',
  timestamps: false,
});

module.exports = ApiUsageLog;
