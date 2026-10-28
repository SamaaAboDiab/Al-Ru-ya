import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { UserModel } from '../src/models/User';
import { registerParent, useTestApp } from './helpers';

const ctx = useTestApp();

describe('US-01 parent registration', () => {
  it('registers a mother, signs her in, and returns her role', async () => {
    const { agent, res } = await registerParent(ctx.app);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      data: { name: 'Mona', email: 'mona@example.com', role: 'mother', locale: 'ar' },
    });
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/ruya_token=.+HttpOnly/i);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.role).toBe('mother');
  });

  it('stores the password hashed, never in plain text', async () => {
    await registerParent(ctx.app);
    const user = await UserModel.findOne({ email: 'mona@example.com' }).select('+passwordHash').lean();
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe('password123');
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email, regardless of case', async () => {
    await registerParent(ctx.app);
    const { res } = await registerParent(ctx.app, { email: 'MONA@example.com', role: 'father' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('only allows the mother or father role at sign-up', async () => {
    const { res } = await registerParent(ctx.app, { role: 'child' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.fields.role).toBeDefined();
  });

  it('rejects a short password and a bad email with field errors', async () => {
    const { res } = await registerParent(ctx.app, { email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toMatchObject({
      email: 'EMAIL_INVALID',
      password: 'PASSWORD_TOO_SHORT',
    });
  });

  it('ignores fields that are not in the schema', async () => {
    const { res } = await registerParent(ctx.app);
    expect(res.status).toBe(201);
    const extra = await request(ctx.app).post('/api/auth/register').send({
      name: 'X', email: 'x@example.com', password: 'password123', role: 'father', passwordHash: 'evil',
    });
    expect(extra.status).toBe(201);
    const user = await UserModel.findOne({ email: 'x@example.com' }).select('+passwordHash').lean();
    expect(user?.passwordHash).not.toBe('evil');
  });
});

describe('login', () => {
  it('signs in with the right password', async () => {
    await registerParent(ctx.app, { role: 'father', email: 'ali@example.com' });
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'Ali@Example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('father');
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await registerParent(ctx.app);
    const wrong = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'mona@example.com', password: 'wrong-password' });
    const unknown = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('requires a session for /me and clears it on logout', async () => {
    expect((await request(ctx.app).get('/api/auth/me')).status).toBe(401);

    const { agent } = await registerParent(ctx.app);
    expect((await agent.post('/api/auth/logout')).status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});
