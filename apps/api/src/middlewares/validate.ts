import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ERROR_CODES } from '@ruya/shared';
import { AppError } from '../utils/AppError';

/** Replaces req.body with the parsed, whitelisted result of the schema. */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_';
        fields[key] ??= issue.message;
      }
      return next(new AppError(400, ERROR_CODES.VALIDATION_FAILED, 'Invalid input', fields));
    }
    req.body = parsed.data;
    next();
  };
}
