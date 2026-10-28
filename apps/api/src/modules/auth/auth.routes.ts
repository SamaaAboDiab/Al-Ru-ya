import { Router, type RequestHandler } from 'express';
import {
  completeSignupSchema,
  emailLinkSchema,
  forgotPasswordSchema,
  linkTokenSchema,
  loginSchema,
  registerParentSchema,
  resetPasswordSchema,
} from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createAuthController, type AuthDeps } from './auth.controller';

export function authRoutes(config: Config, authLimiter: RequestHandler, deps: AuthDeps) {
  const router = Router();
  const controller = createAuthController(config, deps);

  router.get('/methods', controller.methods);
  router.post('/register', authLimiter, validateBody(registerParentSchema), controller.register);
  router.post('/login', authLimiter, validateBody(loginSchema), controller.login);

  // Passwordless: an emailed link, then (for newcomers) one last step to create the account.
  router.post('/email-link', authLimiter, validateBody(emailLinkSchema), controller.emailLink);
  router.post('/email-link/verify', authLimiter, validateBody(linkTokenSchema), controller.verifyEmailLink);
  router.get('/google/start', authLimiter, controller.googleStart);
  router.get('/google/callback', authLimiter, controller.googleCallback);
  router.get('/signup', controller.signupDraft);
  router.post('/signup', authLimiter, validateBody(completeSignupSchema), controller.completeSignup);

  router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), controller.forgotPassword);
  router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), controller.resetPassword);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth(config.JWT_SECRET), controller.me);

  return router;
}
