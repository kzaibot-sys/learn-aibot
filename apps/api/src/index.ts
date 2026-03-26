import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { coursesRouter } from './routes/courses';
import { progressRouter } from './routes/progress';
import { paymentsRouter } from './routes/payments';
import { adminRouter } from './routes/admin';
import { botRouter } from './routes/bot';
import { notificationsRouter } from './routes/notifications';
import { certificatesRouter } from './routes/certificates';
import { gamificationRouter } from './routes/gamification';

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

// Raw body for webhook signature verification — must be before json() middleware
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/yookassa/webhook', express.raw({ type: 'application/json' }));

// Parse JSON for all other routes
app.use(express.json());

// Attach rawBody for webhook routes that already parsed
app.use((req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    (req as express.Request & { rawBody: Buffer }).rawBody = req.body;
    req.body = JSON.parse(req.body.toString('utf8'));
  }
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/bot', botRouter);
app.use('/api', gamificationRouter);

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
