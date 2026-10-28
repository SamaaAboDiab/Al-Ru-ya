import type { CookieOptions, Request, Response } from 'express';
import type { UserDTO } from '@ruya/shared';
import type { Config } from '../../config';
import { AUTH_COOKIE, signToken } from '../../middlewares/auth';
import { ok } from '../../utils/respond';
import * as authService from './auth.service';

export function createAuthController(config: Config) {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    path: '/',
  };

  function startSession(res: Response, user: UserDTO) {
    const token = signToken({ id: user.id, role: user.role }, config.JWT_SECRET, config.JWT_EXPIRES_IN_DAYS);
    res.cookie(AUTH_COOKIE, token, {
      ...cookieOptions,
      maxAge: config.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  return {
    async register(req: Request, res: Response) {
      const user = await authService.registerParent(req.body);
      startSession(res, user);
      ok(res, user, 201);
    },

    async login(req: Request, res: Response) {
      const user = await authService.login(req.body);
      startSession(res, user);
      ok(res, user);
    },

    logout(_req: Request, res: Response) {
      res.clearCookie(AUTH_COOKIE, cookieOptions);
      res.status(204).end();
    },

    async me(req: Request, res: Response) {
      ok(res, await authService.getUser(req.user!.id));
    },
  };
}
