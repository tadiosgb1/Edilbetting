'use strict';
const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/marketsController');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Markets
 *   description: Static market catalog — all supported betting market keys
 */

/**
 * @swagger
 * /markets/catalog:
 *   get:
 *     summary: Every known market key grouped by category
 *     tags: [Markets]
 *     responses:
 *       200: { description: Market catalog object }
 */
router.get('/catalog', asyncHandler(ctrl.getCatalog));

module.exports = router;
