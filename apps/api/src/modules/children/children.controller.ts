import type { Request, Response } from 'express';
import { ok } from '../../utils/respond';
import * as childrenService from './children.service';

type ChildParams = { childId: string };

export async function list(req: Request, res: Response) {
  ok(res, await childrenService.listChildrenForParent(req.user!.id));
}

export async function create(req: Request, res: Response) {
  ok(res, await childrenService.createChild(req.user!.id, req.body), 201);
}

export async function getOne(req: Request<ChildParams>, res: Response) {
  ok(res, await childrenService.getChild(req.user!, req.params.childId));
}

export async function createAccount(req: Request<ChildParams>, res: Response) {
  ok(res, await childrenService.createChildAccount(req.user!, req.params.childId, req.body), 201);
}
