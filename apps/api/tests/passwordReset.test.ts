import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { PasswordResetModel } from '../src/models/PasswordReset';
import { registerParent, useTestApp } from './helpers';

const ctx = useTestApp();

const tokenFrom = (text: string) => text.match(/\/reset-password\/([\w-]+)/)![1];

async function forgot(email: string) {
  return request(ctx.app).post('/api/auth/forgot-password').send({ email });
}

describe('forgot password', () => {
  it('emails a link that sets a new password, once', async () => {
    await registerParent(ctx.app);
    expect((await forgot('Mona@Example.com')).status).toBe(204);

    expect(ctx.mails).toHaveLength(1);
    expect(ctx.mails[0].to).toBe('mona@example.com');
    const token = tokenFrom(ctx.mails[0].text);

    const reset = await request(ctx.app).post('/api/auth/reset-password').send({ token, password: 'brand-new-pass' });
    expect(reset.status).toBe(204);

    const login = (password: string) =>
      request(ctx.app).post('/api/auth/login').send({ email: 'mona@example.com', password });
    expect((await login('password123')).status).toBe(401);
    expect((await login('brand-new-pass')).status).toBe(200);

    const again = await request(ctx.app).post('/api/auth/reset-password').send({ token, password: 'another-pass-1' });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe('RESET_LINK_INVALID');
  });

  it('answers the same for unknown emails, and sends nothing', async () => {
    const res = await forgot('nobody@example.com');
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(ctx.mails).toHaveLength(0);
  });

  it('only the newest link works', async () => {
    await registerParent(ctx.app);
    await forgot('mona@example.com');
    await forgot('mona@example.com');
    const [first, second] = ctx.mails.map((m) => tokenFrom(m.text));

    const old = await request(ctx.app).post('/api/auth/reset-password').send({ token: first, password: 'brand-new-pass' });
    expect(old.status).toBe(400);
    const latest = await request(ctx.app).post('/api/auth/reset-password').send({ token: second, password: 'brand-new-pass' });
    expect(latest.status).toBe(204);
  });

  it('rejects expired links', async () => {
    await registerParent(ctx.app);
    await forgot('mona@example.com');
    const token = tokenFrom(ctx.mails[0].text);
    await PasswordResetModel.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });

    const res = await request(ctx.app).post('/api/auth/reset-password').send({ token, password: 'brand-new-pass' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('RESET_LINK_INVALID');
  });

  it('never stores the raw token and still enforces the password rules', async () => {
    await registerParent(ctx.app);
    await forgot('mona@example.com');
    const token = tokenFrom(ctx.mails[0].text);
    const stored = await PasswordResetModel.findOne().lean();
    expect(stored!.tokenHash).not.toContain(token);

    const short = await request(ctx.app).post('/api/auth/reset-password').send({ token, password: 'short' });
    expect(short.status).toBe(400);
    expect(short.body.error.fields.password).toBe('PASSWORD_TOO_SHORT');
  });
});
