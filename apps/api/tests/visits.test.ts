import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { addDays, todayIn } from '@ruya/shared';
import { VisitModel } from '../src/models/Visit';
import { birthDateForAge, registerParent, useTestApp } from './helpers';

const ctx = useTestApp();
type Agent = ReturnType<typeof request.agent>;

/** Mother + father (linked by invitation) + a child with a login. */
async function family(tag = '') {
  const { agent: mother, res: m } = await registerParent(ctx.app, { name: 'Mona', email: `mona${tag}@example.com` });
  const created = await mother.post('/api/children').send({ name: 'Yassin', birthDate: birthDateForAge(12) });
  const childId = created.body.data.id as string;

  const invite = await mother.post(`/api/children/${childId}/invitations`).send({ email: `ali${tag}@example.com` });
  const token = invite.body.data.inviteUrl.split('/invite/')[1];
  const { agent: father, res: f } = await registerParent(ctx.app, {
    name: 'Ali',
    email: `ali${tag}@example.com`,
    role: 'father',
  });
  await father.post(`/api/invitations/${token}/accept`);

  await mother.post(`/api/children/${childId}/account`).send({ email: `kid${tag}@example.com`, password: 'kidpass123' });
  const kid = request.agent(ctx.app);
  await kid.post('/api/auth/login').send({ email: `kid${tag}@example.com`, password: 'kidpass123' });

  return { mother, father, kid, childId, motherId: m.body.data.id as string, fatherId: f.body.data.id as string };
}

const today = () => todayIn();
const url = (childId: string, rest = '') => `/api/children/${childId}/visits${rest}`;

async function pendingVisitWithFather(f: Awaited<ReturnType<typeof family>>) {
  const res = await f.kid
    .post(url(f.childId))
    .send({ parentId: f.fatherId, date: addDays(today(), -1), startTime: '16:00', endTime: '18:00' });
  return res.body.data.id as string;
}

async function notificationsOf(agent: Agent) {
  return (await agent.get('/api/notifications')).body.data as {
    items: { type: string; visitId: string; actorName: string; reason?: { code?: string; note?: string } }[];
    unread: number;
  };
}

describe('US-09 the child logs a visit', () => {
  it('creates a pending visit both parents can see, and notifies them', async () => {
    const f = await family();
    const res = await f.kid
      .post(url(f.childId))
      .send({ parentId: f.fatherId, date: addDays(today(), -1), startTime: '16:00' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'pending', parent: { name: 'Ali', role: 'father' }, canEdit: true });
    expect(res.body.data.history).toEqual([expect.objectContaining({ action: 'created', byName: 'Yassin', byRole: 'child' })]);

    for (const parent of [f.mother, f.father]) {
      const list = (await parent.get(url(f.childId))).body.data;
      expect(list).toHaveLength(1);
      expect(list[0].status).toBe('pending');
      const n = await notificationsOf(parent);
      expect(n.items[0]).toMatchObject({ type: 'visit_logged', visitId: res.body.data.id, actorName: 'Yassin' });
      expect(n.unread).toBe(1);
    }
    // The child acted, so the child isn't notified.
    expect((await notificationsOf(f.kid)).items).toHaveLength(0);
  });

  it('marks a future visit as upcoming', async () => {
    const f = await family();
    const res = await f.kid.post(url(f.childId)).send({ parentId: f.motherId, date: addDays(today(), 3), startTime: '10:00' });
    expect(res.body.data.status).toBe('upcoming');
  });

  it('only accepts one of the child’s own parents', async () => {
    const f = await family();
    const other = await family('-other');
    const res = await f.kid.post(url(f.childId)).send({ parentId: other.fatherId, date: today(), startTime: '10:00' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.parentId).toBe('PARENT_REQUIRED');
  });

  it('lets the child edit on the same day, and records the edit', async () => {
    const f = await family();
    const id = await pendingVisitWithFather(f);
    const res = await f.kid.put(url(f.childId, `/${id}`)).send({ parentId: f.fatherId, date: addDays(today(), -1), startTime: '17:00' });
    expect(res.status).toBe(200);
    expect(res.body.data.startTime).toBe('17:00');
    expect(res.body.data.endTime).toBeUndefined();
    expect(res.body.data.history.map((h: { action: string }) => h.action)).toEqual(['created', 'edited']);
  });

  it('locks edits after the day it was logged', async () => {
    const f = await family();
    const id = await pendingVisitWithFather(f);
    await VisitModel.collection.updateOne(
      { _id: (await VisitModel.findById(id))!._id },
      { $set: { createdAt: new Date(Date.now() - 2 * 86_400_000) } },
    );
    const res = await f.kid.put(url(f.childId, `/${id}`)).send({ parentId: f.fatherId, date: today(), startTime: '17:00' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('VISIT_LOCKED');
  });

  it('does not let parents log or edit visits', async () => {
    const f = await family();
    const id = await pendingVisitWithFather(f);
    expect((await f.mother.post(url(f.childId)).send({ parentId: f.motherId, date: today(), startTime: '10:00' })).status).toBe(403);
    expect((await f.father.put(url(f.childId, `/${id}`)).send({ parentId: f.fatherId, date: today(), startTime: '10:00' })).status).toBe(403);
  });
});

describe('US-10 the parent confirms the child is with them', () => {
  it('confirms with time and author, shows confirmed to both, and notifies the others', async () => {
    const f = await family();
    const id = await pendingVisitWithFather(f);

    const res = await f.father.post(url(f.childId, `/${id}/confirm`));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
    const confirmed = res.body.data.history.at(-1);
    expect(confirmed).toMatchObject({ action: 'confirmed', byName: 'Ali', byRole: 'father' });
    expect(Date.parse(confirmed.at)).not.toBeNaN();

    expect((await f.mother.get(url(f.childId, `/${id}`))).body.data.status).toBe('confirmed');
    expect((await notificationsOf(f.mother)).items[0]).toMatchObject({ type: 'visit_confirmed', actorName: 'Ali' });
    expect((await notificationsOf(f.kid)).items[0]).toMatchObject({ type: 'visit_confirmed' });
  });

  it('only the parent the visit is with can confirm', async () => {
    const f = await family();
    const id = await pendingVisitWithFather(f);
    const view = (await f.mother.get(url(f.childId, `/${id}`))).body.data;
    expect(view.canConfirm).toBe(false);

    const res = await f.mother.post(url(f.childId, `/${id}/confirm`));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NOT_VISIT_PARENT');
  });

  it('cannot confirm before the visit starts or twice', async () => {
    const f = await family();
    const future = await f.kid.post(url(f.childId)).send({ parentId: f.fatherId, date: addDays(today(), 2), startTime: '10:00' });
    const early = await f.father.post(url(f.childId, `/${future.body.data.id}/confirm`));
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('VISIT_NOT_STARTED');

    const id = await pendingVisitWithFather(f);
    await f.father.post(url(f.childId, `/${id}/confirm`));
    const twice = await f.father.post(url(f.childId, `/${id}/confirm`));
    expect(twice.status).toBe(409);
    expect(twice.body.error.code).toBe('VISIT_CLOSED');
  });

  it('closes the visit to child edits once confirmed', async () => {
    const f = await family();
    const id = await pendingVisitWithFather(f);
    await f.father.post(url(f.childId, `/${id}/confirm`));
    const res = await f.kid.put(url(f.childId, `/${id}`)).send({ parentId: f.fatherId, date: today(), startTime: '09:00' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('VISIT_CLOSED');
  });
});

describe('US-11 "I can\'t visit"', () => {
  it('requires a reason', async () => {
    const f = await family();
    const id = await pendingVisitWithFather(f);
    const none = await f.father.post(url(f.childId, `/${id}/cancel`)).send({});
    expect(none.status).toBe(400);
    expect(none.body.error.fields.reasonCode).toBe('REASON_REQUIRED');

    const otherWithoutNote = await f.father.post(url(f.childId, `/${id}/cancel`)).send({ reasonCode: 'other' });
    expect(otherWithoutNote.status).toBe(400);
  });

  it('cancels with the reason, keeps it in the log, and notifies the other parent and the child', async () => {
    const f = await family();
    const id = await pendingVisitWithFather(f);
    const res = await f.father.post(url(f.childId, `/${id}/cancel`)).send({ reasonCode: 'sick', note: 'Fever since morning' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      status: 'cancelled',
      cancelReason: { code: 'sick', note: 'Fever since morning' },
      canCancel: false,
    });
    expect(res.body.data.history.at(-1)).toMatchObject({ action: 'cancelled', byName: 'Ali' });

    for (const agent of [f.mother, f.kid]) {
      const n = (await notificationsOf(agent)).items[0];
      expect(n).toMatchObject({ type: 'visit_cancelled', actorName: 'Ali', reason: { code: 'sick', note: 'Fever since morning' } });
    }
    // Still listed: the log keeps cancelled visits.
    expect((await f.mother.get(url(f.childId))).body.data[0].status).toBe('cancelled');
  });

  it('works for a date the child has not logged', async () => {
    const f = await family();
    const res = await f.mother
      .post(url(f.childId, '/cant-visit'))
      .send({ date: addDays(today(), 2), startTime: '15:00', note: 'Stuck at work' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'cancelled', parent: { name: 'Mona' }, cancelReason: { note: 'Stuck at work' } });
    expect((await notificationsOf(f.father)).items[0].type).toBe('visit_cancelled');
    expect((await notificationsOf(f.kid)).items[0].type).toBe('visit_cancelled');
  });

  it('only the visit’s parent can cancel, and not after confirmation', async () => {
    const f = await family();
    const id = await pendingVisitWithFather(f);
    expect((await f.mother.post(url(f.childId, `/${id}/cancel`)).send({ reasonCode: 'work' })).status).toBe(403);
    expect((await f.kid.post(url(f.childId, `/${id}/cancel`)).send({ reasonCode: 'work' })).status).toBe(403);

    await f.father.post(url(f.childId, `/${id}/confirm`));
    const late = await f.father.post(url(f.childId, `/${id}/cancel`)).send({ reasonCode: 'work' });
    expect(late.status).toBe(409);
  });
});

describe('US-13 visit log', () => {
  it('lists every visit newest first and never deletes', async () => {
    const f = await family();
    await f.kid.post(url(f.childId)).send({ parentId: f.fatherId, date: addDays(today(), -3), startTime: '10:00' });
    await f.kid.post(url(f.childId)).send({ parentId: f.motherId, date: addDays(today(), -1), startTime: '10:00' });
    const list = (await f.father.get(url(f.childId))).body.data;
    expect(list.map((v: { date: string }) => v.date)).toEqual([addDays(today(), -1), addDays(today(), -3)]);

    expect((await f.mother.delete(url(f.childId, `/${list[0].id}`))).status).toBe(404);
    expect(await VisitModel.countDocuments()).toBe(2);
  });

  it('hides visits from other families', async () => {
    const f = await family();
    const other = await family('-other');
    const id = await pendingVisitWithFather(f);
    expect((await other.mother.get(url(f.childId))).status).toBe(404);
    expect((await other.kid.get(url(f.childId, `/${id}`))).status).toBe(404);
    expect((await other.father.post(url(f.childId, `/${id}/confirm`))).status).toBe(404);
  });
});

describe('US-12 notifications', () => {
  it('marks one or all as read, and keeps each person’s list private', async () => {
    const f = await family();
    await pendingVisitWithFather(f);
    await f.kid.post(url(f.childId)).send({ parentId: f.motherId, date: today(), startTime: '00:00' });

    const before = await notificationsOf(f.mother);
    expect(before.unread).toBe(2);

    const first = (await f.mother.get('/api/notifications')).body.data.items[0].id;
    expect((await f.father.post(`/api/notifications/${first}/read`)).status).toBe(404);
    expect((await f.mother.post(`/api/notifications/${first}/read`)).status).toBe(204);
    expect((await notificationsOf(f.mother)).unread).toBe(1);

    expect((await f.mother.post('/api/notifications/read-all')).status).toBe(204);
    expect((await notificationsOf(f.mother)).unread).toBe(0);
    expect((await notificationsOf(f.father)).unread).toBe(2);
  });
});
