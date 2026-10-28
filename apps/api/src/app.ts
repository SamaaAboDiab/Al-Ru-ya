import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import type { Config } from './config';
import type { Logger } from './utils/logger';
import { createLogMailer, type Mailer } from './utils/mailer';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { childrenRoutes } from './modules/children/children.routes';
import { childInvitationRoutes, invitationRoutes } from './modules/invitations/invitations.routes';

export function createApp(config: Config, logger: Logger, mailer: Mailer = createLogMailer(logger)) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (config.NODE_ENV !== 'test') app.use(pinoHttp({ logger }));

  const limiter = (limit: number) =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: config.NODE_ENV === 'test' ? 1000 : limit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, _res, next) => next({ status: 429 }),
    });
  const invitationDeps = { mailer, logger, webOrigin: config.WEB_ORIGIN };

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });
  app.use('/api/auth', authRoutes(config, limiter(20)));
  app.use(
    '/api/children/:childId/invitations',
    childInvitationRoutes(config, invitationDeps, limiter(20)),
  );
  app.use('/api/children', childrenRoutes(config));
  app.use('/api/invitations', invitationRoutes(config, invitationDeps, limiter(60)));

  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
