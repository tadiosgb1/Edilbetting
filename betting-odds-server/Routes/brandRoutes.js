'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/Brandcontroller');
const asyncHandler = require('../middleware/asyncHandler');
const adminAuth = require('../middleware/adminAuth');

router.get('/', asyncHandler(ctrl.getBrand));
router.put('/', adminAuth, asyncHandler(ctrl.updateBrand));

module.exports = router;
