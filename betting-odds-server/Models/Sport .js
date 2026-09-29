const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sport = sequelize.define('Sport', {
  sportKey: { type: DataTypes.STRING(100), primaryKey: true, field: 'sport_key' },
  title: { type: DataTypes.STRING(150), allowNull: false },
  groupName: { type: DataTypes.STRING(100), field: 'group_name' }, // API's sport category, e.g. "Soccer"
  country: { type: DataTypes.STRING(100) },                        // resolved ourselves — API has no country field
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: false },       // do WE offer this league
  hasOutrights: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_outrights' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
}, {
  tableName: 'sports',
});

module.exports = Sport;