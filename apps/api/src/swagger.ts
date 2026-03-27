import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AiBot LMS API',
      version: '2.0.0',
      description: 'API for AiBot LMS platform. Includes student-facing endpoints (JWT auth), admin endpoints, and Bot API for external Telegram bot integration.',
    },
    servers: [
      { url: '/api', description: 'API base' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from POST /auth/login or POST /auth/telegram',
        },
        BotSecret: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Bot-Secret',
          description: 'Shared secret for Bot API endpoints',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', nullable: true },
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            middleName: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            coverUrl: { type: 'string', nullable: true },
            totalModules: { type: 'integer' },
            totalLessons: { type: 'integer' },
            enrollmentCount: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication' },
      { name: 'Courses', description: 'Course catalog' },
      { name: 'Progress', description: 'Lesson progress' },
      { name: 'Certificates', description: 'Certificates' },
      { name: 'Notifications', description: 'Notifications' },
      { name: 'Bot API', description: 'External bot integration (X-Bot-Secret)' },
      { name: 'Admin', description: 'Admin endpoints' },
      { name: 'Videos', description: 'Video streaming' },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
