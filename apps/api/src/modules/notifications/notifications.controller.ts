import type { Request, Response } from 'express';
import { ok } from '../../utils/respond';
import * as notificationsService from './notifications.service';

export async function list(req: Request, res: Response) {
  ok(res, await notificationsService.listNotifications(req.user!));
}

export async function read(req: Request<{ id: string }>, res: Response) {
  await notificationsService.markRead(req.user!, req.params.id);
  res.status(204).end();
}

export async function readAll(req: Request, res: Response) {
  await notificationsService.markAllRead(req.user!);
  res.status(204).end();
}
