import { Router, type RequestHandler } from 'express';
import { loginSchema, registerParentSchema } from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createAuthController } from './auth.controller';

export function authRoutes(config: Config, authLimiter: RequestHandler) {
  const router = Router();
  const controller = createAuthController(config);

  router.post('/register', authLimiter, validateBody(registerParentSchema), controller.register);
  router.post('/login', authLimiter, validateBody(loginSchema), controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth(config.JWT_SECRET), controller.me);

  return router;
}
