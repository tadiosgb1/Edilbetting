const express = require('express');
const router = express.Router();

router.use('/sports', require('./sportsRoutes'));
router.use('/events', require('./eventsRoutes'));
router.use('/odds', require('./oddsRoutes'));
router.use('/markets', require('./marketsRoutes'));
router.use('/wallet', require('./walletRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/bets', require('./betRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/health', require('./healthRoutes'));

module.exports = router;