'use strict';
const { DataTypes } = require('sequelize');
const { v4: uuidv4 }  = require('uuid');
const sequelize = require('../config/database');

const Bet = sequelize.define('Bet', {
  betId:           { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: () => uuidv4(), field: 'bet_id' },
  userId:          { type: DataTypes.CHAR(36),    allowNull: false, field: 'user_id' },
  stake:           { type: DataTypes.DECIMAL(14,2), allowNull: false },
  totalOdds:       { type: DataTypes.DECIMAL(10,4), allowNull: false, field: 'total_odds' },
  potentialPayout: { type: DataTypes.DECIMAL(14,2), allowNull: false, field: 'potential_payout' },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'won', 'lost', 'void', 'cancelled'),
    defaultValue: 'pending',
  },
  placedAt:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'placed_at' },
  settledAt:  { type: DataTypes.DATE, field: 'settled_at' },
}, {
  tableName:  'bets',
  timestamps: false,
});

module.exports = Bet;
