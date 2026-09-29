require('dotenv').config();

const app = require('./app');
const { initDatabase } = require('./models');
const cronScheduler = require('./jobs/cronScheduler');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Connects to MySQL and creates/updates every table from the models —
    // this is what makes "run server.js and the tables appear in the DB" work.
    await initDatabase();
    logger.info('✅ Database connected and synced (tables created/updated).');

    cronScheduler.start();

    app.listen(PORT, () => {
      logger.info(`🎲 Edilbetting API running → http://localhost:${PORT}`);
      if (process.env.SWAGGER_ENABLED === 'true') {
        logger.info(`📘 Swagger docs      → http://localhost:${PORT}${process.env.SWAGGER_PATH || '/api-docs'}`);
      }
      logger.info(`💓 Health check      → http://localhost:${PORT}/api/health`);
      logger.info(`🔑 Odds API key set  → ${process.env.ODDS_API_KEY ? 'yes' : '❌ NO — check your .env'}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();