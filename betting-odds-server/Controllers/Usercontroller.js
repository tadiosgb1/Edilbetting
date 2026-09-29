'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Wallet } = require('../Models/Index');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

function publicUser(user) {
  const data = user.toJSON();
  delete data.passwordHash;
  return data;
}

async function register(req, res) {
  const { phoneNumber, fullName, dateOfBirth, password } = req.body;

  if (!phoneNumber || !password) {
    return res.status(400).json({
      success: false,
      error: 'phoneNumber and password are required.',
    });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters.',
    });
  }

  const existing = await User.findOne({ where: { phoneNumber } });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'A user with this phone number already exists.',
    });
  }

  const passwordHash = await bcrypt.hash(String(password), 12);

  const user = await User.create({
    phoneNumber: String(phoneNumber).trim(),
    fullName: fullName ? String(fullName).trim() : null,
    dateOfBirth: dateOfBirth || null,
    passwordHash,
    kycStatus: 'unverified',
    status: 'active',
    isAdmin: false,
  });

  await Wallet.create({
    userId: user.userId,
    balance: 0,
    currency: 'ETB',
  });

  return res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    user: publicUser(user),
  });
}

async function login(req, res) {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    return res.status(400).json({
      success: false,
      error: 'phoneNumber and password are required.',
    });
  }

  const user = await User.findOne({ where: { phoneNumber: String(phoneNumber).trim() } });

  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return res.status(401).json({
      success: false,
      error: 'Invalid phone number or password.',
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: `User account is ${user.status}.`,
    });
  }

  const token = jwt.sign(
    { userId: user.userId, phoneNumber: user.phoneNumber, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: publicUser(user),
  });
}

async function getUser(req, res) {
  const user = await User.findByPk(req.params.userId, {
    attributes: { exclude: ['passwordHash'] },
    include: [{ model: Wallet }],
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found.',
    });
  }

  return res.json({
    success: true,
    user,
  });
}

async function listUsers(req, res) {
  const users = await User.findAll({
    attributes: { exclude: ['passwordHash'] },
    order: [['createdAt', 'DESC']],
  });

  return res.json({
    success: true,
    count: users.length,
    users,
  });
}

module.exports = {
  register,
  login,
  getUser,
  listUsers,
};
