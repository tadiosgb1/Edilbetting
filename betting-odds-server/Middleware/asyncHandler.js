'use strict';

/**
 * Wraps an async route handler so any thrown error or rejected promise
 * automatically reaches Express's error handler — no try/catch needed
 * in every controller function.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
