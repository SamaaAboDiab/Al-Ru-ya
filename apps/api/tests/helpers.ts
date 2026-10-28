import { afterAll, afterEach, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';
import { createLogger } from '../src/utils/logger';
import type { MailMessage } from '../src/utils/mailer';

let mongo: MongoMemoryServer;

/** `env` adds settings, e.g. Google credentials, on top of the test defaults. */
export function useTestApp(env: Record<string, string> = {}) {
  const ctx = { mails: [] } as unknown as { app: ReturnType<typeof createApp>; mails: MailMessage[] };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await mongoose.connection.syncIndexes();
    const config = loadConfig({
      NODE_ENV: 'test',
      MONGODB_URI: mongo.getUri(),
      JWT_SECRET: 'test-secret-that-is-long-enough-for-validation',
      ...env,
    });
    ctx.app = createApp(config, createLogger('silent', false), {
      send: async (message) => {
        ctx.mails.push(message);
      },
    });
  });

  afterEach(async () => {
    ctx.mails.length = 0;
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

/** Mother + father (linked by invitation) + a 12-year-old child with a login. */
export async function linkedFamily(app: ReturnType<typeof createApp>, tag = '') {
  const { agent: mother, res: m } = await registerParent(app, { name: 'Mona', email: `mona${tag}@example.com` });
  const created = await mother.post('/api/children').send({ name: 'Yassin', birthDate: birthDateForAge(12) });
  const childId = created.body.data.id as string;

  const invite = await mother.post(`/api/children/${childId}/invitations`).send({ email: `ali${tag}@example.com` });
  const token = invite.body.data.inviteUrl.split('/invite/')[1];
  const { agent: father, res: f } = await registerParent(app, {
    name: 'Ali',
    email: `ali${tag}@example.com`,
    role: 'father',
  });
  await father.post(`/api/invitations/${token}/accept`);

  await mother.post(`/api/children/${childId}/account`).send({ email: `kid${tag}@example.com`, password: 'kidpass123' });
  const kid = request.agent(app);
  await kid.post('/api/auth/login').send({ email: `kid${tag}@example.com`, password: 'kidpass123' });

  return { mother, father, kid, childId, motherId: m.body.data.id as string, fatherId: f.body.data.id as string };
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
