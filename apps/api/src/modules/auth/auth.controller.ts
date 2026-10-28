import type { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  ERROR_CODES,
  ROLES,
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
import type { SmsSender } from '../../utils/sms';
import { ok } from '../../utils/respond';
import * as authService from './auth.service';
import * as google from './google.service';
import * as passwordless from './passwordless.service';
import * as phoneService from './phone.service';
import * as resetService from './passwordReset.service';

const OAUTH_COOKIE = 'ruya_oauth';
const OAUTH_TTL_MINUTES = 10;

/** Same-site paths only, so a sign-in can never send someone to another site. */
const safeNext = (value: unknown) =>
  typeof value === 'string' && /^\/(?![/\\])/.test(value) && value.length <= 300 ? value : undefined;

export interface AuthDeps {
  mailer: Mailer;
  logger: Logger;
  webOrigin: string;
  sms: SmsSender;
}

export function createAuthController(config: Config, deps: AuthDeps) {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    path: '/',
  };
  const passwordlessDeps = { ...deps, secret: config.JWT_SECRET };
  const googleConfig =
    config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET
      ? {
          clientId: config.GOOGLE_CLIENT_ID,
          clientSecret: config.GOOGLE_CLIENT_SECRET,
          // Through the web origin, so the session cookie lands on the site people use.
          redirectUri: `${deps.webOrigin}/api/auth/google/callback`,
        }
      : null;
  const toWeb = (path: string) => `${deps.webOrigin}${path}`;

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
      // Without a real SMS provider, codes only reach the log: fine for trying it out, not for real users.
      ok<AuthMethodsDTO>(res, { google: Boolean(googleConfig), phone: deps.sms.live || config.NODE_ENV !== 'production' });
    },

    /** Sends the browser to Google, remembering (signed, in a cookie) what must come back. */
    googleStart(req: Request, res: Response) {
      if (!googleConfig) throw AppError.notFound('Route');
      const trip = google.newRoundTrip();
      const next = safeNext(req.query.next);
      const sealed = jwt.sign({ state: trip.state, verifier: trip.verifier, next }, config.JWT_SECRET, {
        audience: 'oauth',
        expiresIn: `${OAUTH_TTL_MINUTES}m`,
      });
      res.cookie(OAUTH_COOKIE, sealed, { ...cookieOptions, maxAge: OAUTH_TTL_MINUTES * 60 * 1000 });
      res.redirect(google.authorizeUrl(googleConfig, trip.state, trip.challenge));
    },

    /** Google sends the browser back here. Every failure lands on the login page with one message. */
    async googleCallback(req: Request, res: Response) {
      const failed = () => res.redirect(toWeb('/login?error=google'));
      if (!googleConfig) return failed();
      res.clearCookie(OAUTH_COOKIE, cookieOptions);

      let trip: { state: string; verifier: string; next?: string };
      try {
        trip = jwt.verify(req.cookies?.[OAUTH_COOKIE] ?? '', config.JWT_SECRET, {
          audience: 'oauth',
          algorithms: ['HS256'],
        }) as typeof trip;
      } catch {
        return failed();
      }
      const { code, state } = req.query;
      if (typeof code !== 'string' || typeof state !== 'string' || state !== trip.state) return failed();

      let outcome: Awaited<ReturnType<typeof google.signInWithGoogle>>;
      try {
        outcome = await google.signInWithGoogle(googleConfig, code, trip.verifier);
      } catch (err) {
        deps.logger.error({ err }, 'Google sign-in failed');
        return failed();
      }
      if (!outcome) return failed();

      const next = safeNext(trip.next);
      if ('user' in outcome) {
        res.clearCookie(SIGNUP_COOKIE, cookieOptions);
        startSession(res, outcome.user);
        return res.redirect(toWeb(next ?? (outcome.user.role === ROLES.CHILD ? '/child' : '/parent')));
      }
      keepDraft(res, outcome.draft);
      res.redirect(toWeb(`/register/complete${next ? `?next=${encodeURIComponent(next)}` : ''}`));
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

    async phoneSend(req: Request, res: Response) {
      await phoneService.sendCode(req.body.phone, req.body.locale ?? 'ar', { ...deps, secret: config.JWT_SECRET });
      res.status(204).end();
    },

    async phoneVerify(req: Request, res: Response) {
      finishSignIn(res, await phoneService.verifyCode(req.body.phone, req.body.code, config.JWT_SECRET));
    },

    async phoneLink(req: Request, res: Response) {
      ok(res, await phoneService.linkPhone(req.user!.id, req.body.phone, req.body.code, config.JWT_SECRET));
    },

    async phoneUnlink(req: Request, res: Response) {
      ok(res, await phoneService.unlinkPhone(req.user!.id));
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
