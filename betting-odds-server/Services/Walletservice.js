'use strict';
const { sequelize, Wallet, WalletTransaction } = require('../models');

/**
 * The ONLY place wallet balances should ever change.
 * Runs inside a DB transaction with a row-level lock so concurrent
 * requests (e.g. a bet and a withdrawal at the same instant) cannot
 * race each other into a negative balance.
 *
 * @param {string}  userId          - user UUID
 * @param {number}  amount          - positive = credit, negative = debit
 * @param {string}  type            - WalletTransaction type enum value
 * @param {string}  referenceType   - 'bet' | 'payment_proof' | 'admin'
 * @param {string}  referenceId     - betId / paymentProof.id / 'manual'
 * @param {object}  [externalTxn]   - reuse an existing Sequelize transaction
 */
async function adjustBalance(userId, amount, type, referenceType, referenceId, externalTxn) {
  const run = async (t) => {
    const wallet = await Wallet.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!wallet) throw new Error(`Wallet not found for user ${userId}`);

    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    if (newBalance < 0) throw new Error('Insufficient wallet balance');

    wallet.balance = newBalance;
    await wallet.save({ transaction: t });

    const tx = await WalletTransaction.create({
      userId,
      type,
      amount,
      balanceAfter:  newBalance,
      referenceType,
      referenceId,
    }, { transaction: t });

    return { wallet, transaction: tx };
  };

  if (externalTxn) return run(externalTxn);
  return sequelize.transaction(run);
}

async function getOrCreateWallet(userId) {
  const [wallet] = await Wallet.findOrCreate({
    where:    { userId },
    defaults: { balance: 0, currency: 'ETB' },
  });
  return wallet;
}

module.exports = { adjustBalance, getOrCreateWallet };
