import type { Request, Response } from 'express';
import { ok } from '../../utils/respond';
import * as photosService from './photos.service';

export async function show(req: Request<{ userId: string }>, res: Response) {
  const photo = await photosService.getPhoto(req.user!, req.params.userId);
  // The URL carries the photo's version, so the browser may keep it; "private" keeps it out of shared caches.
  res.set({
    'Content-Type': photo.contentType,
    'Content-Disposition': 'inline',
    'Cache-Control': 'private, max-age=31536000, immutable',
  });
  res.send(photo.data);
}

export async function update(req: Request, res: Response) {
  ok(res, await photosService.setPhoto(req.user!, req.body));
}

export async function remove(req: Request, res: Response) {
  await photosService.removePhoto(req.user!);
  res.status(204).end();
}
