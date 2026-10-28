import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { InvitationModel } from '../src/models/Invitation';
import { birthDateForAge, registerParent, useTestApp } from './helpers';

const ctx = useTestApp();

const tokenFrom = (url: string) => url.split('/invite/')[1];

async function motherWithChild() {
  const { agent } = await registerParent(ctx.app);
  const child = await agent.post('/api/children').send({ name: 'Yassin', birthDate: birthDateForAge(11) });
  return { mother: agent, childId: child.body.data.id as string };
}

async function invite(agent: ReturnType<typeof request.agent>, childId: string, email = 'ali@example.com') {
  return agent.post(`/api/children/${childId}/invitations`).send({ email });
}

describe('US-04 inviting the other parent', () => {
  it('creates an invitation, emails the link, and returns it to the inviter', async () => {
    const { mother, childId } = await motherWithChild();
    const res = await invite(mother, childId);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: 'ali@example.com', status: 'pending' });
    expect(res.body.data.inviteUrl).toMatch(/^http:\/\/localhost:3000\/invite\/[\w-]{40,}$/);

    const days = (Date.parse(res.body.data.expiresAt) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThanOrEqual(7);

    expect(ctx.mails).toHaveLength(1);
    expect(ctx.mails[0].to).toBe('ali@example.com');
    expect(ctx.mails[0].text).toContain(res.body.data.inviteUrl);
  });

  it('stores only a hash of the token', async () => {
    const { mother, childId } = await motherWithChild();
    const res = await invite(mother, childId);
    const stored = await InvitationModel.findOne().select('+tokenHash').lean();
    expect(stored?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored?.tokenHash).not.toBe(tokenFrom(res.body.data.inviteUrl));
  });

  it('lets the invited parent preview, register with that email, and accept', async () => {
    const { mother, childId } = await motherWithChild();
    const token = tokenFrom((await invite(mother, childId)).body.data.inviteUrl);

    const preview = await request(ctx.app).get(`/api/invitations/${token}`);
    expect(preview.status).toBe(200);
    expect(preview.body.data).toMatchObject({
      childName: 'Yassin',
      inviterName: 'Mona',
      email: 'ali@example.com',
      status: 'pending',
    });

    const { agent: father } = await registerParent(ctx.app, {
      name: 'Ali',
      email: 'ali@example.com',
      role: 'father',
    });
    const accept = await father.post(`/api/invitations/${token}/accept`);
    expect(accept.status).toBe(200);
    expect(accept.body.data.id).toBe(childId);
    expect(accept.body.data.parents.map((p: { name: string }) => p.name).sort()).toEqual(['Ali', 'Mona']);

    // Both parents now see the child.
    expect((await father.get('/api/children')).body.data).toHaveLength(1);
    expect((await father.get(`/api/children/${childId}`)).status).toBe(200);

    const stored = await InvitationModel.findOne().lean();
    expect(stored).toMatchObject({ status: 'accepted' });
    expect(stored?.acceptedAt).toBeInstanceOf(Date);
  });

  it('refuses a link opened by an account with a different email', async () => {
    const { mother, childId } = await motherWithChild();
    const token = tokenFrom((await invite(mother, childId)).body.data.inviteUrl);
    const { agent: stranger } = await registerParent(ctx.app, { email: 'other@example.com', role: 'father' });

    const res = await stranger.post(`/api/invitations/${token}/accept`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('INVITE_EMAIL_MISMATCH');
    expect((await stranger.get(`/api/children/${childId}`)).status).toBe(404);
  });

  it('cannot be used twice', async () => {
    const { mother, childId } = await motherWithChild();
    const token = tokenFrom((await invite(mother, childId)).body.data.inviteUrl);
    const { agent: father } = await registerParent(ctx.app, { email: 'ali@example.com', role: 'father' });

    expect((await father.post(`/api/invitations/${token}/accept`)).status).toBe(200);
    const again = await father.post(`/api/invitations/${token}/accept`);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('INVITE_USED');
  });

  it('expires after 7 days', async () => {
    const { mother, childId } = await motherWithChild();
    const token = tokenFrom((await invite(mother, childId)).body.data.inviteUrl);
    await InvitationModel.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const { agent: father } = await registerParent(ctx.app, { email: 'ali@example.com', role: 'father' });

    expect((await request(ctx.app).get(`/api/invitations/${token}`)).body.data.status).toBe('expired');
    const res = await father.post(`/api/invitations/${token}/accept`);
    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe('INVITE_EXPIRED');
  });

  it('replaces an earlier pending invitation to the same email', async () => {
    const { mother, childId } = await motherWithChild();
    const first = tokenFrom((await invite(mother, childId)).body.data.inviteUrl);
    await invite(mother, childId);
    const { agent: father } = await registerParent(ctx.app, { email: 'ali@example.com', role: 'father' });

    const res = await father.post(`/api/invitations/${first}/accept`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVITE_USED');

    const list = await mother.get(`/api/children/${childId}/invitations`);
    expect(list.body.data.map((i: { status: string }) => i.status)).toEqual(['pending', 'revoked']);
  });

  it('rejects inviting yourself', async () => {
    const { mother, childId } = await motherWithChild();
    const res = await invite(mother, childId, 'mona@example.com');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CANNOT_INVITE_SELF');
  });

  it('stops at two parents per child', async () => {
    const { mother, childId } = await motherWithChild();
    const token = tokenFrom((await invite(mother, childId)).body.data.inviteUrl);
    const { agent: father } = await registerParent(ctx.app, { email: 'ali@example.com', role: 'father' });
    await father.post(`/api/invitations/${token}/accept`);

    const third = await invite(mother, childId, 'third@example.com');
    expect(third.status).toBe(409);
    expect(third.body.error.code).toBe('CHILD_HAS_BOTH_PARENTS');
  });

  it('only lets linked parents invite or list invitations', async () => {
    const { childId } = await motherWithChild();
    const { agent: stranger } = await registerParent(ctx.app, { email: 'x@example.com', role: 'father' });
    expect((await invite(stranger, childId)).status).toBe(404);
    expect((await stranger.get(`/api/children/${childId}/invitations`)).status).toBe(404);
    expect(await InvitationModel.countDocuments()).toBe(0);
  });

  it('requires sign-in to accept and rejects unknown tokens', async () => {
    const { mother, childId } = await motherWithChild();
    const token = tokenFrom((await invite(mother, childId)).body.data.inviteUrl);
    expect((await request(ctx.app).post(`/api/invitations/${token}/accept`)).status).toBe(401);

    const unknown = await request(ctx.app).get('/api/invitations/not-a-real-token');
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe('INVITE_NOT_FOUND');
  });

  it('validates the email', async () => {
    const { mother, childId } = await motherWithChild();
    const res = await invite(mother, childId, 'nope');
    expect(res.status).toBe(400);
    expect(res.body.error.fields.email).toBe('EMAIL_INVALID');
  });
});
