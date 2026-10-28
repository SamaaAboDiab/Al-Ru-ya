import { Router } from 'express';
import { ROLES, scheduleItemSchema } from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './schedule.controller';

/** Mounted under /api/children/:childId/schedule */
export function scheduleRoutes(config: Config) {
  const router = Router({ mergeParams: true });
  // US-06: parents read, only the child writes.
  const childOnly = requireRole(ROLES.CHILD);

  router.use(requireAuth(config.JWT_SECRET));
  router.get('/', controller.list);
  router.post('/', childOnly, validateBody(scheduleItemSchema), controller.create);
  router.put('/:itemId', childOnly, validateBody(scheduleItemSchema), controller.update);
  router.delete('/:itemId', childOnly, controller.remove);

  return router;
}
