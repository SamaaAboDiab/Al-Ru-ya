import { describe, expect, it } from 'vitest';
import { linkedFamily, useTestApp } from './helpers';

const ctx = useTestApp();
const family = (tag = '') => linkedFamily(ctx.app, tag);
const msgs = (childId: string, parentId: string) => `/api/children/${childId}/conversations/${parentId}/messages`;

describe('US-14 the child talks to each parent separately', () => {
  it('keeps two separate conversations, both visible to the child', async () => {
    const f = await family();
    await f.kid.post(msgs(f.childId, f.motherId)).send({ body: 'Hi mama' });
    await f.kid.post(msgs(f.childId, f.fatherId)).send({ body: 'Hi baba' });

    const mine = (await f.kid.get(`/api/children/${f.childId}/conversations`)).body.data;
    expect(mine).toHaveLength(2);
    const byRole = Object.fromEntries(mine.map((c: { parent: { role: string } }) => [c.parent.role, c]));
    expect(byRole.mother.lastMessage).toMatchObject({ body: 'Hi mama', fromMe: true });
    expect(byRole.father.lastMessage).toMatchObject({ body: 'Hi baba', fromMe: true });

    const withMom = (await f.kid.get(msgs(f.childId, f.motherId))).body.data;
    expect(withMom.map((m: { body: string }) => m.body)).toEqual(['Hi mama']);
  });

  it('shows each parent only their own conversation', async () => {
    const f = await family();
    await f.kid.post(msgs(f.childId, f.motherId)).send({ body: 'Secret for mama' });

    const dadList = (await f.father.get(`/api/children/${f.childId}/conversations`)).body.data;
    expect(dadList).toHaveLength(1);
    expect(dadList[0].parent.role).toBe('father');
    expect(dadList[0].lastMessage).toBeUndefined();

    // The father can't read or write the mother's conversation.
    expect((await f.father.get(msgs(f.childId, f.motherId))).status).toBe(404);
    expect((await f.father.post(msgs(f.childId, f.motherId)).send({ body: 'hi' })).status).toBe(404);
    expect((await f.father.post(`/api/children/${f.childId}/conversations/${f.motherId}/read`)).status).toBe(404);

    const momView = (await f.mother.get(msgs(f.childId, f.motherId))).body.data;
    expect(momView[0]).toMatchObject({ body: 'Secret for mama', fromMe: false, senderRole: 'child' });
  });

  it('keeps other families and unlinked people out', async () => {
    const f = await family();
    const other = await family('-other');
    expect((await other.kid.get(msgs(f.childId, f.motherId))).status).toBe(404);
    expect((await other.mother.get(`/api/children/${f.childId}/conversations`)).status).toBe(404);
    // A parent id that isn't linked to this child is not a conversation.
    expect((await f.kid.get(msgs(f.childId, other.motherId))).status).toBe(404);
    expect((await f.kid.get(msgs(f.childId, 'not-an-id'))).status).toBe(404);
  });

  it('tracks unread counts and read receipts per side', async () => {
    const f = await family();
    await f.kid.post(msgs(f.childId, f.fatherId)).send({ body: 'one' });
    await f.kid.post(msgs(f.childId, f.fatherId)).send({ body: 'two' });

    expect((await f.father.get(`/api/children/${f.childId}/conversations`)).body.data[0].unread).toBe(2);
    expect((await f.father.post(`/api/children/${f.childId}/conversations/${f.fatherId}/read`)).status).toBe(204);
    expect((await f.father.get(`/api/children/${f.childId}/conversations`)).body.data[0].unread).toBe(0);

    const kidView = (await f.kid.get(msgs(f.childId, f.fatherId))).body.data;
    expect(kidView.every((m: { read: boolean }) => m.read)).toBe(true);
    // Reading your own messages doesn't count.
    const kidList = (await f.kid.get(`/api/children/${f.childId}/conversations`)).body.data;
    expect(kidList.every((c: { unread: number }) => c.unread === 0)).toBe(true);
  });

  it('validates the message', async () => {
    const f = await family();
    const empty = await f.kid.post(msgs(f.childId, f.motherId)).send({ body: '   ' });
    expect(empty.status).toBe(400);
    expect(empty.body.error.fields.body).toBe('MESSAGE_REQUIRED');
    const long = await f.kid.post(msgs(f.childId, f.motherId)).send({ body: 'x'.repeat(1001) });
    expect(long.body.error.fields.body).toBe('MESSAGE_TOO_LONG');
  });
});

describe('US-15 parents send encouragement', () => {
  it('lands only in that parent’s conversation with the child', async () => {
    const f = await family();
    const sent = await f.mother.post(msgs(f.childId, f.motherId)).send({ body: 'Proud of you ❤️' });
    expect(sent.status).toBe(201);
    expect(sent.body.data).toMatchObject({ senderRole: 'mother', fromMe: true, read: false });

    const kidList = (await f.kid.get(`/api/children/${f.childId}/conversations`)).body.data;
    const mom = kidList.find((c: { parent: { role: string } }) => c.parent.role === 'mother');
    const dad = kidList.find((c: { parent: { role: string } }) => c.parent.role === 'father');
    expect(mom).toMatchObject({ unread: 1, lastMessage: { body: 'Proud of you ❤️', fromMe: false } });
    expect(dad.lastMessage).toBeUndefined();

    expect((await f.father.get(msgs(f.childId, f.motherId))).status).toBe(404);
  });

  it('pages back through older messages', async () => {
    const f = await family();
    for (let i = 0; i < 55; i += 1) {
      await f.mother.post(msgs(f.childId, f.motherId)).send({ body: `m${i}` });
    }
    const latest = (await f.kid.get(msgs(f.childId, f.motherId))).body.data;
    expect(latest).toHaveLength(50);
    expect(latest.at(-1).body).toBe('m54');

    const older = (await f.kid.get(`${msgs(f.childId, f.motherId)}?before=${latest[0].id}`)).body.data;
    expect(older.map((m: { body: string }) => m.body)).toEqual(['m0', 'm1', 'm2', 'm3', 'm4']);
  });
});
