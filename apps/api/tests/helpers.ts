import { afterAll, afterEach, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';
import { createLogger } from '../src/utils/logger';

let mongo: MongoMemoryServer;

export function useTestApp() {
  const ctx = {} as { app: ReturnType<typeof createApp> };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await mongoose.connection.syncIndexes();
    const config = loadConfig({
      NODE_ENV: 'test',
      MONGODB_URI: mongo.getUri(),
      JWT_SECRET: 'test-secret-that-is-long-enough-for-validation',
    });
    ctx.app = createApp(config, createLogger('silent', false));
  });

  afterEach(async () => {
    await Promise.all(
      Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})),
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  return ctx;
}

/** A YYYY-MM-DD birth date for someone who turns `years` old `offsetDays` from today. */
export function birthDateForAge(years: number, offsetDays = 0) {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function registerParent(
  app: ReturnType<typeof createApp>,
  overrides: Partial<{ name: string; email: string; password: string; role: string }> = {},
) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({
    name: 'Mona',
    email: 'mona@example.com',
    password: 'password123',
    role: 'mother',
    ...overrides,
  });
  return { agent, res };
}
