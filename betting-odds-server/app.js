const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve persisted payment screenshots.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Swagger UI ──────────────────────────────────────────────────────────
if (process.env.SWAGGER_ENABLED === 'true') {
  const swaggerPath = process.env.SWAGGER_PATH || '/api-docs';
  app.use(swaggerPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Edilbetting API Docs',
  }));
}

// ── API routes ──────────────────────────────────────────────────────────
app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Edilbetting API is running.',
    docs: process.env.SWAGGER_ENABLED === 'true' ? (process.env.SWAGGER_PATH || '/api-docs') : 'disabled',
    health: '/api/health',
  });
});

// ── 404 ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found.' });
});

// ── Central error handler (must be last) ───────────────────────────────
app.use(errorHandler);

module.exports = app;