import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { UserModel } from '../src/models/User';
import { registerParent, useTestApp } from './helpers';

const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const ctx = useTestApp({ GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: 'test-secret' });

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

/** Stands in for Google's token endpoint, answering with an ID token carrying `claims`. */
function googleReturns(claims: Record<string, unknown>) {
  const idToken = `${b64({ alg: 'RS256' })}.${b64({
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 600,
    email_verified: true,
    ...claims,
  })}.signature`;
  const fake = vi.fn(async () => new Response(JSON.stringify({ id_token: idToken }), { status: 200 }));
  vi.stubGlobal('fetch', fake);
  return fake;
}

/** Starts a round trip and returns the agent (holding the cookie) and the state Google would echo. */
async function startTrip(next?: string) {
  const agent = request.agent(ctx.app);
  const res = await agent.get(`/api/auth/google/start${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  expect(res.status).toBe(302);
  const url = new URL(res.headers.location);
  expect(url.host).toBe('accounts.google.com');
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  return { agent, state: url.searchParams.get('state')! };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sign in with Google', () => {
  it('is offered once configured', async () => {
    expect((await request(ctx.app).get('/api/auth/methods')).body.data.google).toBe(true);
  });

  it('takes a newcomer to the last step with their Google name and email, then keeps the link', async () => {
    googleReturns({ sub: 'g-123', email: 'Sara@Gmail.com', name: 'Sara A.' });
    const { agent, state } = await startTrip('/invite/abc');

    const back = await agent.get(`/api/auth/google/callback?code=one-time&state=${state}`);
    expect(back.status).toBe(302);
    expect(back.headers.location).toBe('http://localhost:3000/register/complete?next=%2Finvite%2Fabc');
    expect((await agent.get('/api/auth/signup')).body.data).toEqual({
      name: 'Sara A.',
      email: 'sara@gmail.com',
      emailVerified: true,
    });

    expect((await agent.post('/api/auth/signup').send({ name: 'Sara', role: 'mother' })).status).toBe(201);

    // Next time, the Google account alone signs her in.
    googleReturns({ sub: 'g-123', email: 'sara@gmail.com' });
    const again = await startTrip();
    const res = await again.agent.get(`/api/auth/google/callback?code=x&state=${again.state}`);
    expect(res.headers.location).toBe('http://localhost:3000/parent');
    expect((await again.agent.get('/api/auth/me')).body.data.email).toBe('sara@gmail.com');
  });

  it('signs in and links an existing account with the same email', async () => {
    await registerParent(ctx.app);
    googleReturns({ sub: 'g-mona', email: 'mona@example.com' });
    const { agent, state } = await startTrip();

    const res = await agent.get(`/api/auth/google/callback?code=x&state=${state}`);
    expect(res.headers.location).toBe('http://localhost:3000/parent');
    const linked = await UserModel.findOne({ email: 'mona@example.com' }).select('+googleId').lean();
    expect(linked!.googleId).toBe('g-mona');
  });

  it('rejects a callback whose state does not match this browser', async () => {
    const fake = googleReturns({ sub: 'g-1', email: 'a@gmail.com' });
    const { agent } = await startTrip();
    const res = await agent.get('/api/auth/google/callback?code=x&state=forged');
    expect(res.headers.location).toBe('http://localhost:3000/login?error=google');
    expect(fake).not.toHaveBeenCalled();

    // And one with no round trip started at all.
    const stranger = await request(ctx.app).get('/api/auth/google/callback?code=x&state=anything');
    expect(stranger.headers.location).toBe('http://localhost:3000/login?error=google');
  });

  it('rejects unverified emails and tokens meant for another app', async () => {
    for (const claims of [
      { sub: 'g-1', email: 'a@gmail.com', email_verified: false },
      { sub: 'g-1', email: 'a@gmail.com', aud: 'someone-else' },
      { sub: 'g-1', email: 'a@gmail.com', exp: Math.floor(Date.now() / 1000) - 10 },
    ]) {
      googleReturns(claims);
      const { agent, state } = await startTrip();
      const res = await agent.get(`/api/auth/google/callback?code=x&state=${state}`);
      expect(res.headers.location).toBe('http://localhost:3000/login?error=google');
    }
  });

  it('ignores a return path that leaves the site', async () => {
    googleReturns({ sub: 'g-9', email: 'b@gmail.com' });
    const { agent, state } = await startTrip('//evil.com');
    const res = await agent.get(`/api/auth/google/callback?code=x&state=${state}`);
    expect(res.headers.location).toBe('http://localhost:3000/register/complete');
  });
});
