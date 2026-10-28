import { Router } from 'express';
import { PARENT_ROLES, ROLES, cancelVisitSchema, cantVisitSchema, visitSchema } from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './visits.controller';

/**
 * Mounted under /api/children/:childId/visits. There is no DELETE: the log is permanent (US-13).
 * Who-may-act checks beyond the role (the visit's own parent, same-day edits) live in the service.
 */
export function visitRoutes(config: Config) {
  const router = Router({ mergeParams: true });
  const childOnly = requireRole(ROLES.CHILD);
  const parentsOnly = requireRole(...PARENT_ROLES);

  router.use(requireAuth(config.JWT_SECRET));
  router.get('/', controller.list);
  router.post('/', childOnly, validateBody(visitSchema), controller.create);
  router.post('/cant-visit', parentsOnly, validateBody(cantVisitSchema), controller.cantVisit);
  router.get('/:visitId', controller.getOne);
  router.put('/:visitId', childOnly, validateBody(visitSchema), controller.update);
  router.post('/:visitId/confirm', parentsOnly, controller.confirm);
  router.post('/:visitId/cancel', parentsOnly, validateBody(cancelVisitSchema), controller.cancel);

  return router;
}
