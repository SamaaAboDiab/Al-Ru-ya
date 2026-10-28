import { Router } from 'express';
import { PARENT_ROLES, createChildAccountSchema, createChildSchema } from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './children.controller';

export function childrenRoutes(config: Config) {
  const router = Router();
  const parentsOnly = requireRole(...PARENT_ROLES);

  router.use(requireAuth(config.JWT_SECRET));

  router.get('/', parentsOnly, controller.list);
  router.post('/', parentsOnly, validateBody(createChildSchema), controller.create);
  // Parents linked to the child, or the child itself.
  router.get('/:childId', controller.getOne);
  router.post(
    '/:childId/account',
    parentsOnly,
    validateBody(createChildAccountSchema),
    controller.createAccount,
  );

  return router;
}
