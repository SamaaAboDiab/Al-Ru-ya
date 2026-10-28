import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import type { Config } from './config';
import type { Logger } from './utils/logger';
import { createLogMailer, type Mailer } from './utils/mailer';
import { createLogSms, type SmsSender } from './utils/sms';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { childrenRoutes } from './modules/children/children.routes';
import { childInvitationRoutes, invitationRoutes } from './modules/invitations/invitations.routes';
import { scheduleRoutes } from './modules/schedule/schedule.routes';
import { dailyLogRoutes } from './modules/dailyLogs/dailyLogs.routes';
import { visitRoutes } from './modules/visits/visits.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { messageRoutes } from './modules/messages/messages.routes';
import { photoRoutes } from './modules/photos/photos.routes';

export function createApp(
  config: Config,
  logger: Logger,
  mailer: Mailer = createLogMailer(logger),
  sms: SmsSender = createLogSms(logger),
) {
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
  const mailDeps = { mailer, logger, webOrigin: config.WEB_ORIGIN };

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });
  app.use('/api/auth', authRoutes(config, limiter(20), { ...mailDeps, sms }));
  app.use(
    '/api/children/:childId/invitations',
    childInvitationRoutes(config, mailDeps, limiter(20)),
  );
  app.use('/api/children/:childId/schedule', scheduleRoutes(config));
  app.use('/api/children/:childId/daily-logs', dailyLogRoutes(config));
  app.use('/api/children/:childId/visits', visitRoutes(config));
  app.use('/api/children/:childId/conversations', messageRoutes(config, limiter(300)));
  app.use('/api/notifications', notificationRoutes(config));
  app.use('/api/users', photoRoutes(config, limiter(30)));
  app.use('/api/children', childrenRoutes(config));
  app.use('/api/invitations', invitationRoutes(config, mailDeps, limiter(60)));

  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
