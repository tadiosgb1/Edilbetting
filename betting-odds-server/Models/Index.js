'use strict';

const sequelize = require('../config/database');

const Sport = require('./Sport');
const MarketCatalog = require('./MarketCatalog');
const Event = require('./Event');
const EventMarket = require('./Eventmarket');
const OddsCurrent = require('./Oddscurrent');
const OddsHistory = require('./Oddshistory');
const Result = require('./Result');
const User = require('./User');
const Wallet = require('./Wallet');
const WalletTransaction = require('./Wallettransaction');
const PaymentProof = require('./Paymentproof');
const Bet = require('./Bet');
const BetSelection = require('./BetSelection');
const ApiUsageLog = require('./Apiusagelog');
const AuditLog = require('./Auditlog');
const Brand = require('./Brand');

if (!Event.associations.sport) Event.belongsTo(Sport, { foreignKey: 'sportKey', targetKey: 'sportKey' });
if (!Sport.associations.events) Sport.hasMany(Event, { foreignKey: 'sportKey', sourceKey: 'sportKey' });

if (!Event.associations.markets) Event.hasMany(EventMarket, { foreignKey: 'eventId', sourceKey: 'eventId', as: 'markets' });
if (!EventMarket.associations.Event) EventMarket.belongsTo(Event, { foreignKey: 'eventId', targetKey: 'eventId' });

if (!OddsCurrent.associations.Event) OddsCurrent.belongsTo(Event, { foreignKey: 'eventId', targetKey: 'eventId' });
if (!Event.associations.odds) Event.hasMany(OddsCurrent, { foreignKey: 'eventId', sourceKey: 'eventId', as: 'odds' });

if (!OddsHistory.associations.Event) OddsHistory.belongsTo(Event, { foreignKey: 'eventId', targetKey: 'eventId' });
if (!Result.associations.Event) Result.belongsTo(Event, { foreignKey: 'eventId', targetKey: 'eventId' });
if (!Event.associations.Result) Event.hasOne(Result, { foreignKey: 'eventId', sourceKey: 'eventId' });

if (!Wallet.associations.User) Wallet.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId' });
if (!User.associations.Wallet) User.hasOne(Wallet, { foreignKey: 'userId', sourceKey: 'userId' });

if (!WalletTransaction.associations.User) WalletTransaction.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId' });
if (!User.associations.WalletTransactions) User.hasMany(WalletTransaction, { foreignKey: 'userId', sourceKey: 'userId' });

if (!PaymentProof.associations.User) PaymentProof.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId' });
if (!User.associations.PaymentProofs) User.hasMany(PaymentProof, { foreignKey: 'userId', sourceKey: 'userId' });
if (!PaymentProof.associations.Bet) PaymentProof.belongsTo(Bet, { foreignKey: 'betId', targetKey: 'betId', as: 'Bet' });
if (!Bet.associations.PaymentProofs) Bet.hasMany(PaymentProof, { foreignKey: 'betId', sourceKey: 'betId', as: 'PaymentProofs' });

if (!Bet.associations.User) Bet.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId' });
if (!User.associations.Bets) User.hasMany(Bet, { foreignKey: 'userId', sourceKey: 'userId' });

if (!BetSelection.associations.Bet) BetSelection.belongsTo(Bet, { foreignKey: 'betId', targetKey: 'betId' });
if (!Bet.associations.selections) Bet.hasMany(BetSelection, { foreignKey: 'betId', sourceKey: 'betId', as: 'selections' });
if (!BetSelection.associations.Event) BetSelection.belongsTo(Event, { foreignKey: 'eventId', targetKey: 'eventId' });

async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  await Brand.findOrCreate({ where: { id: 1 }, defaults: { id: 1, primary: '#F59E0B', secondary: '#0F172A', tertiary: '#1E293B' } });
}

module.exports = { sequelize, initDatabase, Sport, MarketCatalog, Event, EventMarket, OddsCurrent, OddsHistory, Result, User, Wallet, WalletTransaction, PaymentProof, Bet, BetSelection, ApiUsageLog, AuditLog, Brand };
