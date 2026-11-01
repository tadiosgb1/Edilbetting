const express = require('express');
const router = express.Router();

router.use('/sports', require('./Sportsroutes'));
router.use('/events', require('./Eventsroutes'));
router.use('/odds', require('./Oddsroutes'));
router.use('/markets', require('./Marketsroutes'));
router.use('/wallet', require('./walletRoutes'));
router.use('/payments', require('./paymentsRoutes'));
router.use('/bets', require('./betsRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/health', require('./Healthroutes'));
router.use('/users', require('./usersRoutes'));
router.use('/brands', require('./brandRoutes'));

module.exports = router;