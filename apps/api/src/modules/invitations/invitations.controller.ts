import type { Request, Response } from 'express';
import { ok } from '../../utils/respond';
import * as invitationsService from './invitations.service';
import type { InvitationDeps } from './invitations.service';

type ChildParams = { childId: string };
type TokenParams = { token: string };

export function createInvitationsController(deps: InvitationDeps) {
  return {
    async create(req: Request<ChildParams>, res: Response) {
      const invitation = await invitationsService.createInvitation(
        req.user!,
        req.params.childId,
        req.body.email,
        deps,
      );
      ok(res, invitation, 201);
    },

    async list(req: Request<ChildParams>, res: Response) {
      ok(res, await invitationsService.listInvitations(req.user!, req.params.childId));
    },

    async preview(req: Request<TokenParams>, res: Response) {
      ok(res, await invitationsService.previewInvitation(req.params.token));
    },

    async accept(req: Request<TokenParams>, res: Response) {
      ok(res, await invitationsService.acceptInvitation(req.user!, req.params.token));
    },
  };
}
