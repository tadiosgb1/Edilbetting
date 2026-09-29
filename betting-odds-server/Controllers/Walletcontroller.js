'use strict';
const { WalletTransaction } = require('../models');
const { getOrCreateWallet } = require('../services/walletService');

/** GET /api/wallet/:userId/balance */
async function getBalance(req, res) {
  const wallet = await getOrCreateWallet(req.params.userId);
  res.json({ success: true, balance: parseFloat(wallet.balance), currency: wallet.currency });
}

/** GET /api/wallet/:userId/transactions */
async function getTransactions(req, res) {
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
  const transactions = await WalletTransaction.findAll({
    where: { userId: req.params.userId },
    order: [['createdAt', 'DESC']],
    limit,
  });
  res.json({ success: true, count: transactions.length, data: transactions });
}

module.exports = { getBalance, getTransactions };
