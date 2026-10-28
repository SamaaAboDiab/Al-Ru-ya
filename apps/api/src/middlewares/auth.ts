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
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      req.user = { id: String(payload.sub), role: payload.role as Role };
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
