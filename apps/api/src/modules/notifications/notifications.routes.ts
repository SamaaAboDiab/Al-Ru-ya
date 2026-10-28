import { Router } from 'express';
import type { Config } from '../../config';
import { requireAuth } from '../../middlewares/auth';
import * as controller from './notifications.controller';

/** Mounted under /api/notifications. Everyone only ever sees their own. */
export function notificationRoutes(config: Config) {
  const router = Router();

  router.use(requireAuth(config.JWT_SECRET));
  router.get('/', controller.list);
  router.post('/read-all', controller.readAll);
  router.post('/:id/read', controller.read);

  return router;
}
