'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/Brandcontroller');
const asyncHandler = require('../middleware/asyncHandler');
router.get('/', asyncHandler(ctrl.getBrand));
router.put('/', asyncHandler(ctrl.updateBrand));

module.exports = router;
