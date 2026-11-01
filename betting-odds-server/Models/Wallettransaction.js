'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WalletTransaction = sequelize.define('WalletTransaction', {
  id:            { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userId:        { type: DataTypes.CHAR(36), allowNull: false, field: 'user_id' },
  type: {
    type: DataTypes.ENUM('deposit', 'withdrawal', 'bet_stake', 'bet_payout', 'bet_refund', 'adjustment'),
    allowNull: false,
  },
  amount:        { type: DataTypes.DECIMAL(14,2), allowNull: false },
  balanceAfter:  { type: DataTypes.DECIMAL(14,2), allowNull: false, field: 'balance_after' },
  referenceType: { type: DataTypes.STRING(30), field: 'reference_type' },
  referenceId:   { type: DataTypes.STRING(64), field: 'reference_id' },
}, {
  tableName:  'wallet_transactions',
  updatedAt:  false,
  indexes:    [{ fields: ['user_id', 'created_at'] }],
});

module.exports = WalletTransaction;
