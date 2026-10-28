import { Router, type RequestHandler } from 'express';
import { forgotPasswordSchema, loginSchema, registerParentSchema, resetPasswordSchema } from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createAuthController } from './auth.controller';
import type { ResetDeps } from './passwordReset.service';

export function authRoutes(config: Config, authLimiter: RequestHandler, resetDeps: ResetDeps) {
  const router = Router();
  const controller = createAuthController(config, resetDeps);

  router.post('/register', authLimiter, validateBody(registerParentSchema), controller.register);
  router.post('/login', authLimiter, validateBody(loginSchema), controller.login);
  router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), controller.forgotPassword);
  router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), controller.resetPassword);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth(config.JWT_SECRET), controller.me);

  return router;
}
