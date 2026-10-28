import { Router, type RequestHandler } from 'express';
import { PARENT_ROLES, createInvitationSchema } from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import type { InvitationDeps } from './invitations.service';
import { createInvitationsController } from './invitations.controller';

/** Mounted under /api/children/:childId/invitations */
export function childInvitationRoutes(config: Config, deps: InvitationDeps, inviteLimiter: RequestHandler) {
  const router = Router({ mergeParams: true });
  const controller = createInvitationsController(deps);

  router.use(requireAuth(config.JWT_SECRET), requireRole(...PARENT_ROLES));
  router.get('/', controller.list);
  router.post('/', inviteLimiter, validateBody(createInvitationSchema), controller.create);

  return router;
}

/** Mounted under /api/invitations */
export function invitationRoutes(config: Config, deps: InvitationDeps, tokenLimiter: RequestHandler) {
  const router = Router();
  const controller = createInvitationsController(deps);

  router.get('/:token', tokenLimiter, controller.preview);
  router.post(
    '/:token/accept',
    tokenLimiter,
    requireAuth(config.JWT_SECRET),
    requireRole(...PARENT_ROLES),
    controller.accept,
  );

  return router;
}
