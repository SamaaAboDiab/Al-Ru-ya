import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ERROR_CODES, type ApiFailure } from '@ruya/shared';
import { AppError } from '../utils/AppError';
import type { Logger } from '../utils/logger';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(AppError.notFound('Route'));
};

function toAppError(err: unknown): AppError | null {
  if (err instanceof AppError) return err;
  if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
    return new AppError(400, ERROR_CODES.VALIDATION_FAILED, 'Invalid input');
  }
  const e = err as { code?: number; type?: string; status?: number } | null;
  if (e?.code === 11000) {
    return new AppError(409, ERROR_CODES.EMAIL_TAKEN, 'Email is already registered');
  }
  if (e?.type === 'entity.parse.failed') {
    return new AppError(400, ERROR_CODES.VALIDATION_FAILED, 'Malformed JSON');
  }
  if (e?.status === 429) {
    return new AppError(429, ERROR_CODES.TOO_MANY_REQUESTS, 'Too many attempts, try again later');
  }
  return null;
}

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    const known = toAppError(err);
    if (!known) logger.error({ err }, 'Unhandled error');
    const appErr = known ?? new AppError(500, ERROR_CODES.INTERNAL, 'Something went wrong');
    const body: ApiFailure = {
      success: false,
      error: { code: appErr.code, message: appErr.message, fields: appErr.fields },
    };
    res.status(appErr.statusCode).json(body);
  };
}
