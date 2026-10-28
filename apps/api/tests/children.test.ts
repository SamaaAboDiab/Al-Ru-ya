import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { birthDateForAge, registerParent, useTestApp } from './helpers';

const ctx = useTestApp();

async function parentWithChild(age: number, offsetDays = 0) {
  const { agent } = await registerParent(ctx.app);
  const res = await agent
    .post('/api/children')
    .send({ name: 'Yassin', birthDate: birthDateForAge(age, offsetDays) });
  expect(res.status).toBe(201);
  return { agent, childId: res.body.data.id as string };
}

const childLogin = { email: 'yassin@example.com', password: 'kidpass123' };

describe('child profiles', () => {
  it('lets a parent add a child of any age and list them', async () => {
    const { agent } = await parentWithChild(6);
    const list = await agent.get('/api/children');
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual([
      expect.objectContaining({ name: 'Yassin', hasAccount: false }),
    ]);
  });

  it('rejects a birth date in the future', async () => {
    const { agent } = await registerParent(ctx.app);
    const res = await agent.post('/api/children').send({ name: 'Y', birthDate: '2999-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.birthDate).toBe('DATE_IN_FUTURE');
  });
});

describe('US-02 child account', () => {
  it('creates a login for a child who is 10 today', async () => {
    const { agent, childId } = await parentWithChild(10);
    const res = await agent.post(`/api/children/${childId}/account`).send(childLogin);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ role: 'child', childId, email: childLogin.email });

    const child = await agent.get(`/api/children/${childId}`);
    expect(child.body.data.hasAccount).toBe(true);
  });

  it('refuses when the child turns 10 tomorrow, and keeps the profile', async () => {
    const { agent, childId } = await parentWithChild(10, 1);
    const res = await agent.post(`/api/children/${childId}/account`).send(childLogin);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CHILD_TOO_YOUNG');

    const child = await agent.get(`/api/children/${childId}`);
    expect(child.status).toBe(200);
    expect(child.body.data.hasAccount).toBe(false);
  });

  it('allows only one account per child', async () => {
    const { agent, childId } = await parentWithChild(12);
    await agent.post(`/api/children/${childId}/account`).send(childLogin);
    const again = await agent
      .post(`/api/children/${childId}/account`)
      .send({ email: 'other@example.com', password: 'kidpass123' });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('CHILD_ACCOUNT_EXISTS');
  });

  it('rejects an email that is already used', async () => {
    const { agent, childId } = await parentWithChild(12);
    const res = await agent
      .post(`/api/children/${childId}/account`)
      .send({ email: 'mona@example.com', password: 'kidpass123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });
});

describe('US-03 child sign-in', () => {
  it('signs the child in to their own profile only', async () => {
    const { agent, childId } = await parentWithChild(11);
    await agent.post(`/api/children/${childId}/account`).send(childLogin);

    const kid = request.agent(ctx.app);
    const login = await kid.post('/api/auth/login').send(childLogin);
    expect(login.status).toBe(200);
    expect(login.body.data).toMatchObject({ role: 'child', childId });

    expect((await kid.get(`/api/children/${childId}`)).status).toBe(200);
  });

  it('returns 403 when a child calls parent endpoints', async () => {
    const { agent, childId } = await parentWithChild(11);
    await agent.post(`/api/children/${childId}/account`).send(childLogin);
    const kid = request.agent(ctx.app);
    await kid.post('/api/auth/login').send(childLogin);

    const list = await kid.get('/api/children');
    expect(list.status).toBe(403);
    expect(list.body.error.code).toBe('FORBIDDEN');
    expect((await kid.post('/api/children').send({ name: 'Z', birthDate: '2015-01-01' })).status).toBe(403);
    expect((await kid.post(`/api/children/${childId}/account`).send(childLogin)).status).toBe(403);
  });
});

describe('US-05 data isolation', () => {
  it('hides a child from a parent who is not linked to them', async () => {
    const { childId } = await parentWithChild(11);
    const { agent: stranger } = await registerParent(ctx.app, {
      email: 'stranger@example.com',
      role: 'father',
    });

    expect((await stranger.get('/api/children')).body.data).toEqual([]);
    expect((await stranger.get(`/api/children/${childId}`)).status).toBe(404);
    const takeover = await stranger.post(`/api/children/${childId}/account`).send(childLogin);
    expect(takeover.status).toBe(404);
  });

  it('keeps siblings apart', async () => {
    const { agent } = await registerParent(ctx.app);
    const a = await agent.post('/api/children').send({ name: 'Adam', birthDate: birthDateForAge(12) });
    const b = await agent.post('/api/children').send({ name: 'Basma', birthDate: birthDateForAge(11) });
    await agent.post(`/api/children/${a.body.data.id}/account`).send(childLogin);

    const adam = request.agent(ctx.app);
    await adam.post('/api/auth/login').send(childLogin);
    expect((await adam.get(`/api/children/${a.body.data.id}`)).status).toBe(200);
    expect((await adam.get(`/api/children/${b.body.data.id}`)).status).toBe(404);
  });

  it('treats a malformed id as not found', async () => {
    const { agent } = await registerParent(ctx.app);
    expect((await agent.get('/api/children/not-an-id')).status).toBe(404);
  });
});
