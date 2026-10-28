import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { addDays, todayIn } from '@ruya/shared';
import { DailyLogModel } from '../src/models/DailyLog';
import { birthDateForAge, registerParent, useTestApp } from './helpers';

const ctx = useTestApp();

async function family(childEmail = 'kid@example.com', parentEmail = 'mona@example.com') {
  const { agent: mother } = await registerParent(ctx.app, { email: parentEmail });
  const created = await mother.post('/api/children').send({ name: 'Yassin', birthDate: birthDateForAge(12) });
  const childId = created.body.data.id as string;
  await mother.post(`/api/children/${childId}/account`).send({ email: childEmail, password: 'kidpass123' });
  const kid = request.agent(ctx.app);
  await kid.post('/api/auth/login').send({ email: childEmail, password: 'kidpass123' });
  return { mother, kid, childId };
}

const today = () => todayIn();

describe('US-07 child logs their day', () => {
  it('saves today with a time for each checked item, in display order', async () => {
    const { kid, childId } = await family();
    const url = `/api/children/${childId}/daily-logs/${today()}`;

    const res = await kid.put(url).send({ items: ['lunch', 'school'] });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ date: today(), editable: true });
    expect(res.body.data.entries.map((e: { item: string }) => e.item)).toEqual(['school', 'lunch']);
    for (const e of res.body.data.entries) expect(Date.parse(e.doneAt)).not.toBeNaN();
  });

  it('keeps the original time for items that stay checked and drops unchecked ones', async () => {
    const { kid, childId } = await family();
    const url = `/api/children/${childId}/daily-logs/${today()}`;

    const first = (await kid.put(url).send({ items: ['school'] })).body.data;
    await new Promise((r) => setTimeout(r, 20));
    const second = (await kid.put(url).send({ items: ['school', 'breakfast'] })).body.data;
    expect(second.entries.find((e: { item: string }) => e.item === 'school').doneAt).toBe(first.entries[0].doneAt);

    const third = (await kid.put(url).send({ items: ['breakfast'] })).body.data;
    expect(third.entries.map((e: { item: string }) => e.item)).toEqual(['breakfast']);
  });

  it('locks past days', async () => {
    const { kid, childId } = await family();
    const yesterday = addDays(today(), -1);
    const res = await kid.put(`/api/children/${childId}/daily-logs/${yesterday}`).send({ items: ['school'] });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('DAY_LOCKED');

    const read = await kid.get(`/api/children/${childId}/daily-logs/${yesterday}`);
    expect(read.status).toBe(200);
    expect(read.body.data).toMatchObject({ entries: [], editable: false });
  });

  it('rejects unknown and repeated items', async () => {
    const { kid, childId } = await family();
    const url = `/api/children/${childId}/daily-logs/${today()}`;
    expect((await kid.put(url).send({ items: ['party'] })).status).toBe(400);
    expect((await kid.put(url).send({ items: ['school', 'school'] })).status).toBe(400);
  });

  it('rejects a malformed date', async () => {
    const { kid, childId } = await family();
    const res = await kid.get(`/api/children/${childId}/daily-logs/yesterday`);
    expect(res.status).toBe(400);
  });
});

describe('US-08 parents see the daily log', () => {
  it('shows both linked parents the same log, read-only', async () => {
    const { mother, kid, childId } = await family();
    const url = `/api/children/${childId}/daily-logs/${today()}`;
    await kid.put(url).send({ items: ['school', 'training'] });

    const seen = await mother.get(url);
    expect(seen.status).toBe(200);
    expect(seen.body.data.editable).toBe(false);
    expect(seen.body.data.entries).toHaveLength(2);

    const write = await mother.put(url).send({ items: [] });
    expect(write.status).toBe(403);
    expect(write.body.error.code).toBe('FORBIDDEN');
  });

  it('shows past days by date', async () => {
    const { mother, childId } = await family();
    const yesterday = addDays(today(), -1);
    await DailyLogModel.create({
      child: childId,
      date: yesterday,
      entries: [{ item: 'homework', doneAt: new Date() }],
      updatedBy: childId,
    });
    const res = await mother.get(`/api/children/${childId}/daily-logs/${yesterday}`);
    expect(res.body.data.entries.map((e: { item: string }) => e.item)).toEqual(['homework']);
  });

  it('hides the log from unrelated parents and other children', async () => {
    const a = await family('a@example.com', 'mom-a@example.com');
    const b = await family('b@example.com', 'mom-b@example.com');
    const url = `/api/children/${a.childId}/daily-logs/${today()}`;
    await a.kid.put(url).send({ items: ['school'] });

    expect((await b.mother.get(url)).status).toBe(404);
    expect((await b.kid.get(url)).status).toBe(404);
    expect((await b.kid.put(url).send({ items: [] })).status).toBe(404);
  });
});
