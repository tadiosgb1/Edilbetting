'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/Usercontroller');
const asyncHandler = require('../Middleware/asyncHandler');
const adminAuth = require('../Middleware/adminAuth');

/**
 * User registration and login.
 */
router.post('/register', asyncHandler(ctrl.register));
router.post('/login', asyncHandler(ctrl.login));

/**
 * Admin-only user listing.
 */
router.get('/', adminAuth, asyncHandler(ctrl.listUsers));

router.get('/:userId', asyncHandler(ctrl.getUser));

module.exports = router;
