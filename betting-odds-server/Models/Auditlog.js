'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id:          { type: DataTypes.BIGINT,     primaryKey: true, autoIncrement: true },
  adminUserId: { type: DataTypes.CHAR(36),   field: 'admin_user_id' },
  action:      { type: DataTypes.STRING(100), allowNull: false },
  targetType:  { type: DataTypes.STRING(50),  field: 'target_type' },
  targetId:    { type: DataTypes.STRING(64),  field: 'target_id' },
  detailsJson: { type: DataTypes.JSON,        field: 'details_json' },
}, {
  tableName:  'audit_log',
  updatedAt:  false,
});

module.exports = AuditLog;
