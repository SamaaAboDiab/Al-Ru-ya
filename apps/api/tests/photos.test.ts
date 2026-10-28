import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { PROFILE_PHOTO_MAX_BYTES } from '@ruya/shared';
import { linkedFamily, registerParent, useTestApp } from './helpers';

const ctx = useTestApp();

// The smallest valid-looking files: the API checks the leading bytes, not the whole image.
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 1)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 2)]);

describe('profile photos', () => {
  it('lets anyone set, replace and remove their own photo', async () => {
    const { kid } = await linkedFamily(ctx.app);

    const set = await kid.put('/api/users/me/photo').set('Content-Type', 'image/png').send(PNG);
    expect(set.status).toBe(200);
    const me = (await kid.get('/api/auth/me')).body.data;
    expect(me.photoUrl).toBe(set.body.data.photoUrl);

    const own = await kid.get(me.photoUrl).buffer(true);
    expect(own.status).toBe(200);
    expect(own.headers['content-type']).toBe('image/png');
    expect(own.headers['cache-control']).toContain('private');
    expect(Buffer.compare(own.body, PNG)).toBe(0);

    // A new photo gets a new URL, so browsers don't keep showing the old one.
    await new Promise((r) => setTimeout(r, 5));
    const replaced = await kid.put('/api/users/me/photo').set('Content-Type', 'image/jpeg').send(JPEG);
    expect(replaced.body.data.photoUrl).not.toBe(me.photoUrl);

    expect((await kid.delete('/api/users/me/photo')).status).toBe(204);
    expect((await kid.get('/api/auth/me')).body.data.photoUrl).toBeUndefined();
    expect((await kid.get(replaced.body.data.photoUrl)).status).toBe(404);
  });

  it('shows the child photo to both parents, and the parents photos to the child', async () => {
    const { mother, father, kid, childId, motherId } = await linkedFamily(ctx.app);
    await kid.put('/api/users/me/photo').set('Content-Type', 'image/png').send(PNG);
    await mother.put('/api/users/me/photo').set('Content-Type', 'image/jpeg').send(JPEG);

    const child = (await father.get(`/api/children/${childId}`)).body.data;
    expect(child.photoUrl).toMatch(/^\/api\/users\/[a-f0-9]{24}\/photo\?v=\d+$/);
    expect((await mother.get(child.photoUrl)).status).toBe(200);
    expect((await father.get(child.photoUrl)).status).toBe(200);

    const seenByKid = (await kid.get(`/api/children/${childId}`)).body.data;
    const mom = seenByKid.parents.find((p: { id: string }) => p.id === motherId);
    expect((await kid.get(mom.photoUrl)).status).toBe(200);
  });

  it('hides photos from people outside the family', async () => {
    const a = await linkedFamily(ctx.app, 'a');
    const b = await linkedFamily(ctx.app, 'b');
    const { agent: stranger } = await registerParent(ctx.app, { email: 'stranger@example.com' });
    await a.kid.put('/api/users/me/photo').set('Content-Type', 'image/png').send(PNG);
    const url = (await a.mother.get(`/api/children/${a.childId}`)).body.data.photoUrl;

    expect((await b.mother.get(url)).status).toBe(404);
    expect((await b.kid.get(url)).status).toBe(404);
    expect((await stranger.get(url)).status).toBe(404);
    expect((await request(ctx.app).get(url)).status).toBe(401);
  });

  it('rejects files that are not images, whatever they claim to be', async () => {
    const { kid } = await linkedFamily(ctx.app);
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

    const fake = await kid.put('/api/users/me/photo').set('Content-Type', 'image/png').send(svg);
    expect(fake.status).toBe(400);
    expect(fake.body.error.code).toBe('PHOTO_INVALID');

    const json = await kid.put('/api/users/me/photo').send({ data: 'x' });
    expect(json.status).toBe(400);

    const svgType = await kid.put('/api/users/me/photo').set('Content-Type', 'image/svg+xml').send(svg);
    expect(svgType.status).toBe(400);
  });

  it('rejects photos over the size limit', async () => {
    const { kid } = await linkedFamily(ctx.app);
    const big = Buffer.concat([PNG, Buffer.alloc(PROFILE_PHOTO_MAX_BYTES)]);
    const res = await kid.put('/api/users/me/photo').set('Content-Type', 'image/png').send(big);
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('TOO_LARGE');
  });
});
