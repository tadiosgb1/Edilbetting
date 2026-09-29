require('dotenv').config();

const app = require('./app');
const { initDatabase } = require('./Models/Index');
const cronScheduler = require('./jobs/cronScheduler');
const logger = require('./Utils/Logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initDatabase();
    logger.info('Database connected and synced (tables created/updated).');
    cronScheduler.start();

    app.listen(PORT, () => {
      logger.info(`Edilbetting API running -> http://localhost:${PORT}`);
      logger.info(`Health check -> http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
