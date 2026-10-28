import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { birthDateForAge, registerParent, useTestApp } from './helpers';

const ctx = useTestApp();

const piano = { activity: 'Piano', day: 'mon', startTime: '17:00', endTime: '18:00', location: 'Music school' };

/** A mother with a 12-year-old who has a login, plus a signed-in agent for the child. */
async function family(childEmail = 'kid@example.com', parentEmail = 'mona@example.com') {
  const { agent: mother } = await registerParent(ctx.app, { email: parentEmail });
  const created = await mother.post('/api/children').send({ name: 'Yassin', birthDate: birthDateForAge(12) });
  const childId = created.body.data.id as string;
  await mother.post(`/api/children/${childId}/account`).send({ email: childEmail, password: 'kidpass123' });
  const kid = request.agent(ctx.app);
  await kid.post('/api/auth/login').send({ email: childEmail, password: 'kidpass123' });
  return { mother, kid, childId };
}

describe('US-06 child weekly schedule', () => {
  it('lets the child add items and returns them in week order starting Saturday', async () => {
    const { kid, childId } = await family();
    const url = `/api/children/${childId}/schedule`;

    const created = await kid.post(url).send(piano);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject(piano);

    await kid.post(url).send({ activity: 'Football', day: 'sat', startTime: '10:00', endTime: '12:00' });
    await kid.post(url).send({ activity: 'Math', day: 'mon', startTime: '09:00', endTime: '10:00' });

    const list = await kid.get(url);
    expect(list.status).toBe(200);
    expect(list.body.data.map((i: { activity: string }) => i.activity)).toEqual(['Football', 'Math', 'Piano']);
    expect(list.body.data[0].location).toBeUndefined();
  });

  it('lets the child edit and delete an item', async () => {
    const { kid, childId } = await family();
    const url = `/api/children/${childId}/schedule`;
    const { id } = (await kid.post(url).send(piano)).body.data;

    const edited = await kid.put(`${url}/${id}`).send({ ...piano, startTime: '16:30', location: '' });
    expect(edited.status).toBe(200);
    expect(edited.body.data.startTime).toBe('16:30');
    expect(edited.body.data.location).toBeUndefined();

    expect((await kid.delete(`${url}/${id}`)).status).toBe(204);
    expect((await kid.get(url)).body.data).toEqual([]);
    expect((await kid.delete(`${url}/${id}`)).status).toBe(404);
  });

  it('shows the schedule to linked parents as read-only', async () => {
    const { mother, kid, childId } = await family();
    const url = `/api/children/${childId}/schedule`;
    const { id } = (await kid.post(url).send(piano)).body.data;

    const seen = await mother.get(url);
    expect(seen.status).toBe(200);
    expect(seen.body.data).toHaveLength(1);

    expect((await mother.post(url).send(piano)).status).toBe(403);
    expect((await mother.put(`${url}/${id}`).send(piano)).status).toBe(403);
    expect((await mother.delete(`${url}/${id}`)).status).toBe(403);
  });

  it('hides the schedule from unrelated parents and from other children', async () => {
    const a = await family('a@example.com', 'mom-a@example.com');
    const b = await family('b@example.com', 'mom-b@example.com');
    const { id } = (await a.kid.post(`/api/children/${a.childId}/schedule`).send(piano)).body.data;

    expect((await b.mother.get(`/api/children/${a.childId}/schedule`)).status).toBe(404);
    expect((await b.kid.get(`/api/children/${a.childId}/schedule`)).status).toBe(404);
    expect((await b.kid.post(`/api/children/${a.childId}/schedule`).send(piano)).status).toBe(404);
    // An item id from another child's schedule is not found under your own child id.
    expect((await b.kid.put(`/api/children/${b.childId}/schedule/${id}`).send(piano)).status).toBe(404);
    expect((await b.kid.delete(`/api/children/${b.childId}/schedule/${id}`)).status).toBe(404);
  });

  it('validates each field', async () => {
    const { kid, childId } = await family();
    const res = await kid.post(`/api/children/${childId}/schedule`).send({
      activity: '',
      day: 'funday',
      startTime: '25:00',
      endTime: '10:00',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toMatchObject({
      activity: 'ACTIVITY_REQUIRED',
      day: 'DAY_REQUIRED',
      startTime: 'TIME_INVALID',
    });
  });

  it('rejects an end time that is not after the start time', async () => {
    const { kid, childId } = await family();
    const res = await kid
      .post(`/api/children/${childId}/schedule`)
      .send({ ...piano, startTime: '18:00', endTime: '17:00' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.endTime).toBe('END_BEFORE_START');
  });

  it('requires sign-in', async () => {
    const { childId } = await family();
    expect((await request(ctx.app).get(`/api/children/${childId}/schedule`)).status).toBe(401);
  });
});
