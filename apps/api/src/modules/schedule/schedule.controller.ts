import type { Request, Response } from 'express';
import { ok } from '../../utils/respond';
import * as scheduleService from './schedule.service';

type ChildParams = { childId: string };
type ItemParams = ChildParams & { itemId: string };

export async function list(req: Request<ChildParams>, res: Response) {
  ok(res, await scheduleService.listSchedule(req.user!, req.params.childId));
}

export async function create(req: Request<ChildParams>, res: Response) {
  ok(res, await scheduleService.addScheduleItem(req.user!, req.params.childId, req.body), 201);
}

export async function update(req: Request<ItemParams>, res: Response) {
  ok(res, await scheduleService.updateScheduleItem(req.user!, req.params.childId, req.params.itemId, req.body));
}

export async function remove(req: Request<ItemParams>, res: Response) {
  await scheduleService.deleteScheduleItem(req.user!, req.params.childId, req.params.itemId);
  res.status(204).end();
}
