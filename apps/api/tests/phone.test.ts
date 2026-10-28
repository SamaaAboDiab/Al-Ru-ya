import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { LoginCodeModel } from '../src/models/LoginCode';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { createLogger } from '../src/utils/logger';
import { createLogMailer } from '../src/utils/mailer';
import type { SmsSender } from '../src/utils/sms';
import { registerParent, useTestApp } from './helpers';

const ctx = useTestApp();
const PHONE = '+201001234567';

/** An app whose texts land in `outbox`, so tests can read the codes. */
function appWithOutbox() {
  const outbox: { to: string; body: string }[] = [];
  const sms: SmsSender = {
    live: true,
    async send(to, body) {
      outbox.push({ to, body });
    },
  };
  const config = loadConfig({
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://unused',
    JWT_SECRET: 'test-secret-that-is-long-enough-for-validation',
  });
  const logger = createLogger('silent', false);
  const app = createApp(config, logger, createLogMailer(logger), sms);
  const lastCode = () => outbox.at(-1)!.body.match(/\d{6}/)![0];
  return { app, outbox, lastCode };
}

describe('sign in with a phone code', () => {
  it('texts a code to the number, however it was typed, and signs a newcomer up with it', async () => {
    const { app, outbox, lastCode } = appWithOutbox();
    expect((await request(app).post('/api/auth/phone/send').send({ phone: '٠١٠٠ ١٢٣ ٤٥٦٧' })).status).toBe(204);
    expect(outbox[0].to).toBe(PHONE);

    const agent = request.agent(app);
    const verified = await agent.post('/api/auth/phone/verify').send({ phone: '01001234567', code: lastCode() });
    expect(verified.body.data).toEqual({ status: 'signup' });
    expect((await agent.get('/api/auth/signup')).body.data).toEqual({ phone: PHONE, emailVerified: false });

    // Without a proven email, the person types one.
    const noEmail = await agent.post('/api/auth/signup').send({ name: 'Ali', role: 'father' });
    expect(noEmail.status).toBe(400);
    const done = await agent.post('/api/auth/signup').send({ name: 'Ali', role: 'father', email: 'ali@example.com' });
    expect(done.status).toBe(201);
    expect(done.body.data).toMatchObject({ phone: PHONE, email: 'ali@example.com' });
  });

  it('signs in the account that has the number', async () => {
    const { app, lastCode } = appWithOutbox();
    const { agent: mona } = await registerParent(app);
    await mona.post('/api/auth/phone/send').send({ phone: PHONE });
    expect((await mona.post('/api/auth/phone/link').send({ phone: PHONE, code: lastCode() })).body.data.phone).toBe(PHONE);

    await LoginCodeModel.deleteMany({}); // skip the resend wait
    const fresh = request.agent(app);
    await fresh.post('/api/auth/phone/send').send({ phone: PHONE });
    const res = await fresh.post('/api/auth/phone/verify').send({ phone: PHONE, code: lastCode() });
    expect(res.body.data).toMatchObject({ status: 'signed-in', user: { email: 'mona@example.com' } });
  });

  it('allows a few wrong guesses, then the code stops working', async () => {
    const { app, lastCode } = appWithOutbox();
    await request(app).post('/api/auth/phone/send').send({ phone: PHONE });
    const right = lastCode();
    const wrong = right === '000000' ? '111111' : '000000';

    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/phone/verify').send({ phone: PHONE, code: wrong });
      expect(res.body.error.code).toBe('CODE_INVALID');
    }
    const late = await request(app).post('/api/auth/phone/verify').send({ phone: PHONE, code: right });
    expect(late.body.error.code).toBe('CODE_INVALID');
  });

  it('works once, and only the newest code works', async () => {
    const { app, lastCode } = appWithOutbox();
    await request(app).post('/api/auth/phone/send').send({ phone: PHONE });
    const first = lastCode();
    await LoginCodeModel.updateMany({}, { createdAt: new Date(Date.now() - 2 * 60 * 1000) });
    await request(app).post('/api/auth/phone/send').send({ phone: PHONE });
    const second = lastCode();

    if (first !== second) {
      expect((await request(app).post('/api/auth/phone/verify').send({ phone: PHONE, code: first })).status).toBe(400);
    }
    expect((await request(app).post('/api/auth/phone/verify').send({ phone: PHONE, code: second })).status).toBe(200);
    expect((await request(app).post('/api/auth/phone/verify').send({ phone: PHONE, code: second })).status).toBe(400);
  });

  it('limits how often a number gets a code', async () => {
    const { app, outbox } = appWithOutbox();
    await request(app).post('/api/auth/phone/send').send({ phone: PHONE });
    const again = await request(app).post('/api/auth/phone/send').send({ phone: PHONE });
    expect(again.status).toBe(429);
    expect(again.body.error.code).toBe('CODE_TOO_SOON');
    expect(outbox).toHaveLength(1);
  });

  it('only texts Egyptian mobiles', async () => {
    const { app, outbox } = appWithOutbox();
    for (const phone of ['+447700900123', '+12025550123', '0223456789']) {
      const res = await request(app).post('/api/auth/phone/send').send({ phone });
      expect(res.status).toBe(400);
      expect(res.body.error.fields.phone).toBe('PHONE_INVALID');
    }
    expect(outbox).toHaveLength(0);
  });

  it("won't move a number to a second account, and says so only to whoever has the code", async () => {
    const { app, lastCode } = appWithOutbox();
    const { agent: mona } = await registerParent(app);
    await mona.post('/api/auth/phone/send').send({ phone: PHONE });
    await mona.post('/api/auth/phone/link').send({ phone: PHONE, code: lastCode() });

    const { agent: ali } = await registerParent(app, { email: 'ali@example.com', role: 'father' });
    const guess = await ali.post('/api/auth/phone/link').send({ phone: PHONE, code: '123456' });
    expect(guess.body.error.code).toBe('CODE_INVALID');

    await LoginCodeModel.deleteMany({});
    await ali.post('/api/auth/phone/send').send({ phone: PHONE });
    const taken = await ali.post('/api/auth/phone/link').send({ phone: PHONE, code: lastCode() });
    expect(taken.status).toBe(409);
    expect(taken.body.error.code).toBe('PHONE_TAKEN');
  });

  it('is offered outside production even before SMS is set up', async () => {
    expect((await request(ctx.app).get('/api/auth/methods')).body.data.phone).toBe(true);
  });
});
