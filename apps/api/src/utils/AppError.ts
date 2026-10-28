import { ERROR_CODES, type ErrorCode } from '@ruya/shared';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string = code,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unauthenticated() {
    return new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Sign in required');
  }

  static forbidden() {
    return new AppError(403, ERROR_CODES.FORBIDDEN, 'You do not have permission');
  }

  static notFound(what = 'Resource') {
    return new AppError(404, ERROR_CODES.NOT_FOUND, `${what} not found`);
  }
}
