import type { Request, Response } from 'express';
import { ok } from '../../utils/respond';
import * as dailyLogsService from './dailyLogs.service';

type Params = { childId: string; date: string };

export async function getOne(req: Request<Params>, res: Response) {
  ok(res, await dailyLogsService.getDailyLog(req.user!, req.params.childId, req.params.date));
}

export async function save(req: Request<Params>, res: Response) {
  ok(res, await dailyLogsService.saveDailyLog(req.user!, req.params.childId, req.params.date, req.body.items));
}
