'use strict';
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || '127.0.0.1',
    port:    parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      underscored: true,  // created_at / updated_at column names
      timestamps:  true,
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

module.exports = sequelize;
