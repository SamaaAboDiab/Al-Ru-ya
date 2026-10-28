import { Router, type RequestHandler } from 'express';
import { messageSchema } from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './messages.controller';

/**
 * Mounted under /api/children/:childId/conversations.
 * Roles aren't checked here: the service allows exactly the child and the one parent of each pair.
 */
export function messageRoutes(config: Config, sendLimiter: RequestHandler) {
  const router = Router({ mergeParams: true });

  router.use(requireAuth(config.JWT_SECRET));
  router.get('/', controller.conversations);
  router.get('/:parentId/messages', controller.list);
  router.post('/:parentId/messages', sendLimiter, validateBody(messageSchema), controller.send);
  router.post('/:parentId/read', controller.read);

  return router;
}
