const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Edilbetting API',
      version: '1.0.0',
      description:
        'Sportsbook backend proxying The Odds API, backed by MySQL. ' +
        'The client never calls The Odds API directly — every route here ' +
        'reads from our own database, which is kept fresh by scheduled cron jobs.',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 3000}/api`, description: 'Local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  // swagger-jsdoc reads JSDoc @swagger blocks from every route file
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);