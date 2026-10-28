import type { Request, Response } from 'express';
import { ok } from '../../utils/respond';
import * as messagesService from './messages.service';

type ChildParams = { childId: string };
type PairParams = ChildParams & { parentId: string };

export async function conversations(req: Request<ChildParams>, res: Response) {
  ok(res, await messagesService.listConversations(req.user!, req.params.childId));
}

export async function list(req: Request<PairParams>, res: Response) {
  const before = typeof req.query.before === 'string' ? req.query.before : undefined;
  ok(res, await messagesService.listMessages(req.user!, req.params.childId, req.params.parentId, before));
}

export async function send(req: Request<PairParams>, res: Response) {
  ok(res, await messagesService.sendMessage(req.user!, req.params.childId, req.params.parentId, req.body.body), 201);
}

export async function read(req: Request<PairParams>, res: Response) {
  await messagesService.markConversationRead(req.user!, req.params.childId, req.params.parentId);
  res.status(204).end();
}
