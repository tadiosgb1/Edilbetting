'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Brand = sequelize.define('Brand', {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  primary: { type: DataTypes.STRING(7), allowNull: false, defaultValue: '#F59E0B' },
  secondary: { type: DataTypes.STRING(7), allowNull: false, defaultValue: '#0F172A' },
  tertiary: { type: DataTypes.STRING(7), allowNull: false, defaultValue: '#1E293B' },
}, {
  tableName: 'brands',
});

module.exports = Brand;
