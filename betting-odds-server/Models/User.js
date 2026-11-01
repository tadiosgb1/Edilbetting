'use strict';
const { DataTypes } = require('sequelize');
const { v4: uuidv4 }  = require('uuid');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  userId:       { type: DataTypes.CHAR(36),   primaryKey: true, defaultValue: () => uuidv4(), field: 'user_id' },
  phoneNumber:  { type: DataTypes.STRING(20), allowNull: false, unique: true, field: 'phone_number' },
  fullName:     { type: DataTypes.STRING(150), field: 'full_name' },
  dateOfBirth:  { type: DataTypes.DATEONLY,   field: 'date_of_birth' },
  kycStatus: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified', 'rejected'),
    defaultValue: 'unverified',
    field: 'kyc_status',
  },
  status: {
    type: DataTypes.ENUM('active', 'blocked', 'self_excluded'),
    defaultValue: 'active',
  },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  isAdmin:      { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_admin' },
}, {
  tableName: 'users',
});

module.exports = User;
