import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@ruya/shared';
import { AppError } from '../utils/AppError';

export const AUTH_COOKIE = 'ruya_token';

export interface AuthUser {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser, secret: string, expiresInDays: number) {
  return jwt.sign({ role: user.role }, secret, {
    subject: user.id,
    expiresIn: `${expiresInDays}d`,
  });
}

export function requireAuth(secret: string): RequestHandler {
  return (req, _res, next) => {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) return next(AppError.unauthenticated());
    try {
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      // A session token names its user and has no audience; this keeps a signup draft from passing as one.
      if (!payload.sub || payload.aud) return next(AppError.unauthenticated());
      req.user = { id: payload.sub, role: payload.role as Role };
      next();
    } catch {
      next(AppError.unauthenticated());
    }
  };
}

/** US-03: a child account calling a parent-only endpoint gets 403. */
export function requireRole(...roles: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthenticated());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
}

export const SIGNUP_COOKIE = 'ruya_signup';

/**
 * What a newcomer proved before creating an account: an email (from a link or Google),
 * a phone number (from a code) and/or a Google account. Signed, short-lived, httpOnly.
 */
export interface SignupDraft {
  email?: string;
  emailVerified: boolean;
  name?: string;
  phone?: string;
  googleId?: string;
}

export function signSignupDraft(draft: SignupDraft, secret: string, ttlMinutes: number) {
  return jwt.sign({ draft }, secret, { audience: 'signup', expiresIn: `${ttlMinutes}m` });
}

export function readSignupDraft(token: string | undefined, secret: string): SignupDraft | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret, { audience: 'signup', algorithms: ['HS256'] }) as jwt.JwtPayload;
    return payload.draft as SignupDraft;
  } catch {
    return null;
  }
}
