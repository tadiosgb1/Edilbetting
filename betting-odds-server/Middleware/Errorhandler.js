'use strict';
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status  = err.statusCode || err.response?.status || 500;
  const message = err.message    || 'Internal server error';
  const details = err.response?.data || undefined;

  logger.error(`${req.method} ${req.originalUrl} → ${status}: ${message}`);

  res.status(status).json({
    success: false,
    error:   message,
    ...(details && { details }),
  });
}

module.exports = errorHandler;
