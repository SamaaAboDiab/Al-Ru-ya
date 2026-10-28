import { Router } from 'express';
import { ROLES, dailyLogSchema } from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './dailyLogs.controller';

/** Mounted under /api/children/:childId/daily-logs */
export function dailyLogRoutes(config: Config) {
  const router = Router({ mergeParams: true });

  router.use(requireAuth(config.JWT_SECRET));
  router.get('/:date', controller.getOne);
  // US-07: only the child writes, and the service allows only today's date.
  router.put('/:date', requireRole(ROLES.CHILD), validateBody(dailyLogSchema), controller.save);

  return router;
}
