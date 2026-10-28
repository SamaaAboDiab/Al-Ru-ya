import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { registerParent, useTestApp } from './helpers';

const ctx = useTestApp();

const tokenFrom = (text: string) => text.match(/\/auth\/email\/([\w-]+)/)![1];

describe('sign in with an emailed link', () => {
  it('signs an existing user in, once', async () => {
    await registerParent(ctx.app);
    const res = await request(ctx.app).post('/api/auth/email-link').send({ email: 'MONA@example.com' });
    expect(res.status).toBe(204);
    expect(ctx.mails[0].to).toBe('mona@example.com');
    const token = tokenFrom(ctx.mails[0].text);

    const agent = request.agent(ctx.app);
    const verified = await agent.post('/api/auth/email-link/verify').send({ token });
    expect(verified.body.data).toMatchObject({ status: 'signed-in', user: { email: 'mona@example.com' } });
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    const again = await request(ctx.app).post('/api/auth/email-link/verify').send({ token });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe('LINK_INVALID');
  });

  it('lets a newcomer finish an account without a password, with the email they proved', async () => {
    await request(ctx.app).post('/api/auth/email-link').send({ email: 'new@example.com' });
    expect(ctx.mails[0].subject).toContain('كمّل');
    const agent = request.agent(ctx.app);
    const verified = await agent.post('/api/auth/email-link/verify').send({ token: tokenFrom(ctx.mails[0].text) });
    expect(verified.body.data).toEqual({ status: 'signup' });
    expect((await agent.get('/api/auth/me')).status).toBe(401);

    expect((await agent.get('/api/auth/signup')).body.data).toEqual({ email: 'new@example.com', emailVerified: true });

    // The proven email wins over anything typed.
    const done = await agent.post('/api/auth/signup').send({ name: 'Sara', role: 'mother', email: 'other@example.com' });
    expect(done.status).toBe(201);
    expect(done.body.data).toMatchObject({ email: 'new@example.com', role: 'mother' });
    expect((await agent.get('/api/auth/me')).body.data.name).toBe('Sara');
    expect((await agent.get('/api/auth/signup')).status).toBe(401);

    // No password was set, so password sign-in fails until one is.
    const login = await request(ctx.app).post('/api/auth/login').send({ email: 'new@example.com', password: 'anything-1' });
    expect(login.status).toBe(401);
  });

  it('carries a same-site return path in the link, and nothing else', async () => {
    await request(ctx.app).post('/api/auth/email-link').send({ email: 'a@example.com', next: '/invite/abc' });
    expect(ctx.mails[0].text).toContain('?next=%2Finvite%2Fabc');

    for (const next of ['//evil.com', '/\\evil.com', 'https://evil.com']) {
      const res = await request(ctx.app).post('/api/auth/email-link').send({ email: 'a@example.com', next });
      expect(res.status).toBe(400);
    }
  });

  it('refuses to finish an account without the proof', async () => {
    const res = await request(ctx.app).post('/api/auth/signup').send({ name: 'Sara', role: 'mother', email: 'x@example.com' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SIGNUP_EXPIRED');
  });

  it('does not accept a signup draft as a session', async () => {
    const draft = jwt.sign({ draft: { email: 'a@b.co', emailVerified: true } }, 'test-secret-that-is-long-enough-for-validation', {
      audience: 'signup',
    });
    const res = await request(ctx.app).get('/api/auth/me').set('Cookie', `ruya_token=${draft}`);
    expect(res.status).toBe(401);
  });
});
