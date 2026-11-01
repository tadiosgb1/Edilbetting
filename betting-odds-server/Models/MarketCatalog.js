const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketCatalog = sequelize.define('MarketCatalog', {
  marketKey: { type: DataTypes.STRING(100), primaryKey: true, field: 'market_key' },
  displayName: { type: DataTypes.STRING(150), allowNull: false, field: 'display_name' },
  category: {
    type: DataTypes.ENUM('featured', 'additional', 'game_period', 'other_soccer', 'player_props'),
    allowNull: false,
  },
  tabLabel: { type: DataTypes.STRING(100), field: 'tab_label' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'market_catalog',
  timestamps: false,
});

module.exports = MarketCatalog;
