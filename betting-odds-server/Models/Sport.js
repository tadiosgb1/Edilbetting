const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sport = sequelize.define('Sport', {
  sportKey: { type: DataTypes.STRING(100), primaryKey: true, field: 'sport_key' },
  title: { type: DataTypes.STRING(150), allowNull: false },
  groupName: { type: DataTypes.STRING(100), field: 'group_name' },
  country: { type: DataTypes.STRING(100) },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  hasOutrights: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_outrights' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
}, {
  tableName: 'sports',
});

module.exports = Sport;
