import type { Request, Response } from 'express';
import { ok } from '../../utils/respond';
import * as visitsService from './visits.service';

type ChildParams = { childId: string };
type VisitParams = ChildParams & { visitId: string };

export async function list(req: Request<ChildParams>, res: Response) {
  ok(res, await visitsService.listVisits(req.user!, req.params.childId));
}

export async function getOne(req: Request<VisitParams>, res: Response) {
  ok(res, await visitsService.getVisit(req.user!, req.params.childId, req.params.visitId));
}

export async function create(req: Request<ChildParams>, res: Response) {
  ok(res, await visitsService.logVisit(req.user!, req.params.childId, req.body), 201);
}

export async function update(req: Request<VisitParams>, res: Response) {
  ok(res, await visitsService.editVisit(req.user!, req.params.childId, req.params.visitId, req.body));
}

export async function confirm(req: Request<VisitParams>, res: Response) {
  ok(res, await visitsService.confirmVisit(req.user!, req.params.childId, req.params.visitId));
}

export async function cancel(req: Request<VisitParams>, res: Response) {
  ok(res, await visitsService.cancelVisit(req.user!, req.params.childId, req.params.visitId, req.body));
}

export async function cantVisit(req: Request<ChildParams>, res: Response) {
  ok(res, await visitsService.reportCantVisit(req.user!, req.params.childId, req.body), 201);
}
