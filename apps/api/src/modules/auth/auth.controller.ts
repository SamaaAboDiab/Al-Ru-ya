import type { CookieOptions, Request, Response } from 'express';
import {
  ERROR_CODES,
  SIGNUP_DRAFT_TTL_MINUTES,
  type AuthMethodsDTO,
  type SignInResultDTO,
  type SignupDraftDTO,
  type UserDTO,
} from '@ruya/shared';
import type { Config } from '../../config';
import {
  AUTH_COOKIE,
  SIGNUP_COOKIE,
  readSignupDraft,
  signSignupDraft,
  signToken,
  type SignupDraft,
} from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';
import type { Logger } from '../../utils/logger';
import type { Mailer } from '../../utils/mailer';
import { ok } from '../../utils/respond';
import * as authService from './auth.service';
import * as passwordless from './passwordless.service';
import * as resetService from './passwordReset.service';

export interface AuthDeps {
  mailer: Mailer;
  logger: Logger;
  webOrigin: string;
}

export function createAuthController(config: Config, deps: AuthDeps) {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    path: '/',
  };
  const passwordlessDeps = { ...deps, secret: config.JWT_SECRET };

  function startSession(res: Response, user: UserDTO) {
    const token = signToken({ id: user.id, role: user.role }, config.JWT_SECRET, config.JWT_EXPIRES_IN_DAYS);
    res.cookie(AUTH_COOKIE, token, {
      ...cookieOptions,
      maxAge: config.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  function keepDraft(res: Response, draft: SignupDraft) {
    res.cookie(SIGNUP_COOKIE, signSignupDraft(draft, config.JWT_SECRET, SIGNUP_DRAFT_TTL_MINUTES), {
      ...cookieOptions,
      maxAge: SIGNUP_DRAFT_TTL_MINUTES * 60 * 1000,
    });
  }

  function draftOf(req: Request) {
    const draft = readSignupDraft(req.cookies?.[SIGNUP_COOKIE], config.JWT_SECRET);
    if (!draft) throw new AppError(401, ERROR_CODES.SIGNUP_EXPIRED, 'Start again to create your account');
    return draft;
  }

  /** Signs in a known user, or keeps a newcomer's proof for the last signup step. */
  function finishSignIn(res: Response, outcome: passwordless.SignInOutcome) {
    if ('user' in outcome) {
      res.clearCookie(SIGNUP_COOKIE, cookieOptions);
      startSession(res, outcome.user);
      ok<SignInResultDTO>(res, { status: 'signed-in', user: outcome.user });
    } else {
      keepDraft(res, outcome.draft);
      ok<SignInResultDTO>(res, { status: 'signup' });
    }
  }

  return {
    methods(_req: Request, res: Response) {
      ok<AuthMethodsDTO>(res, { google: false, phone: false });
    },

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

    async emailLink(req: Request, res: Response) {
      await passwordless.requestEmailLink(req.body, passwordlessDeps);
      res.status(204).end();
    },

    async verifyEmailLink(req: Request, res: Response) {
      finishSignIn(res, await passwordless.verifyEmailLink(req.body.token, config.JWT_SECRET));
    },

    signupDraft(req: Request, res: Response) {
      const { name, email, phone, emailVerified } = draftOf(req);
      ok<SignupDraftDTO>(res, { name, email, phone, emailVerified });
    },

    async completeSignup(req: Request, res: Response) {
      const user = await passwordless.completeSignup(draftOf(req), req.body);
      res.clearCookie(SIGNUP_COOKIE, cookieOptions);
      startSession(res, user);
      ok(res, user, 201);
    },

    async forgotPassword(req: Request, res: Response) {
      await resetService.requestPasswordReset(req.body, deps);
      res.status(204).end();
    },

    async resetPassword(req: Request, res: Response) {
      await resetService.resetPassword(req.body);
      res.status(204).end();
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
