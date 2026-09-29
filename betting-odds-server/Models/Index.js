'use strict';
const sequelize = require('../config/database');

const Sport            = require('./Sport');
const MarketCatalog    = require('./MarketCatalog');
const Event            = require('./Event');
const OddsCurrent      = require('./OddsCurrent');
const OddsHistory      = require('./OddsHistory');
const Result           = require('./Result');
const User             = require('./User');
const Wallet           = require('./Wallet');
const WalletTransaction= require('./WalletTransaction');
const PaymentProof     = require('./PaymentProof');
const Bet              = require('./Bet');
const BetSelection     = require('./BetSelection');
const ApiUsageLog      = require('./ApiUsageLog');
const AuditLog         = require('./AuditLog');

// ── Associations ────────────────────────────────────────────────────────────
Event.belongsTo(Sport,      { foreignKey: 'sportKey', targetKey: 'sportKey' });
Sport.hasMany(Event,        { foreignKey: 'sportKey', sourceKey: 'sportKey' });

OddsCurrent.belongsTo(Event, { foreignKey: 'eventId', targetKey: 'eventId' });
Event.hasMany(OddsCurrent,   { foreignKey: 'eventId', sourceKey: 'eventId', as: 'odds' });

OddsHistory.belongsTo(Event, { foreignKey: 'eventId', targetKey: 'eventId' });

Result.belongsTo(Event,    { foreignKey: 'eventId', targetKey: 'eventId' });
Event.hasOne(Result,       { foreignKey: 'eventId', sourceKey: 'eventId' });

Wallet.belongsTo(User,     { foreignKey: 'userId', targetKey: 'userId' });
User.hasOne(Wallet,        { foreignKey: 'userId', sourceKey: 'userId' });

WalletTransaction.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId' });
User.hasMany(WalletTransaction,   { foreignKey: 'userId', sourceKey: 'userId' });

PaymentProof.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId' });
User.hasMany(PaymentProof,   { foreignKey: 'userId', sourceKey: 'userId' });

Bet.belongsTo(User,  { foreignKey: 'userId', targetKey: 'userId' });
User.hasMany(Bet,    { foreignKey: 'userId', sourceKey: 'userId' });

BetSelection.belongsTo(Bet,   { foreignKey: 'betId',  targetKey: 'betId' });
Bet.hasMany(BetSelection,     { foreignKey: 'betId',  sourceKey: 'betId', as: 'selections' });

BetSelection.belongsTo(Event, { foreignKey: 'eventId', targetKey: 'eventId' });

// ── Database init (called once at startup) ──────────────────────────────────
async function initDatabase() {
  await sequelize.authenticate();
  // alter:true adjusts columns to match models without dropping data.
  // Switch to proper migrations before going to production.
  await sequelize.sync({ alter: true });
}

module.exports = {
  sequelize,
  initDatabase,
  Sport,
  MarketCatalog,
  Event,
  OddsCurrent,
  OddsHistory,
  Result,
  User,
  Wallet,
  WalletTransaction,
  PaymentProof,
  Bet,
  BetSelection,
  ApiUsageLog,
  AuditLog,
};
