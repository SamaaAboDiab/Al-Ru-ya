import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import type { Config } from './config';
import type { Logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { childrenRoutes } from './modules/children/children.routes';

export function createApp(config: Config, logger: Logger) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (config.NODE_ENV !== 'test') app.use(pinoHttp({ logger }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.NODE_ENV === 'test' ? 1000 : 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next({ status: 429 }),
  });

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });
  app.use('/api/auth', authRoutes(config, authLimiter));
  app.use('/api/children', childrenRoutes(config));

  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
