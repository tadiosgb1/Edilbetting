'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Balance is NEVER edited directly from a route — always go through
// walletService.adjustBalance() which also writes the ledger row.
const Wallet = sequelize.define('Wallet', {
  userId:   { type: DataTypes.CHAR(36),     primaryKey: true, field: 'user_id' },
  balance:  { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING(6),    allowNull: false, defaultValue: 'ETB' },
}, {
  tableName: 'wallets',
  createdAt: false,
});

module.exports = Wallet;
