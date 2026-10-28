import { pino } from 'pino';

export function createLogger(level: string, pretty: boolean) {
  return pino({
    level,
    redact: ['req.headers.cookie', 'req.headers.authorization', '*.password', '*.passwordHash'],
    ...(pretty ? { transport: { target: 'pino-pretty' } } : {}),
  });
}

export type Logger = ReturnType<typeof createLogger>;
