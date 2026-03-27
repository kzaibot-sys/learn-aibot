import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { coursesRouter } from './routes/courses';
import { progressRouter } from './routes/progress';
import { adminRouter } from './routes/admin';
import { botRouter } from './routes/bot';
import { notificationsRouter } from './routes/notifications';
import { certificatesRouter } from './routes/certificates';

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));
app.use(cors({
  origin: [config.app.url, config.telegram.miniAppUrl].filter(Boolean),
  credentials: true,
}));

// Compression
app.use(compression());

// Parse JSON
app.use(express.json());

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AiBot LMS API Docs',
}));
app.get('/api/docs/json', (_req, res) => res.json(swaggerSpec));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/bot', botRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API server running on port ${config.port}`);
});

export { app };
