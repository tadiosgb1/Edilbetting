// Wraps an async route handler so thrown errors/rejected promises reach
// Express's error handler automatically, instead of needing a try/catch
// in every single controller function.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;