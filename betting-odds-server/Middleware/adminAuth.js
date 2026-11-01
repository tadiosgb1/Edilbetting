'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

module.exports = function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const roles = Array.isArray(payload.roles) ? payload.roles : [];
    const roleNames = roles.map(role => String(role?.name || role).trim().toLowerCase());
    const isAdmin = payload.isAdmin === true || String(payload.role || '').trim().toLowerCase() === 'admin' || roleNames.includes('admin');

    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }

    req.auth = payload;
    next();
  } catch (_) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
};
