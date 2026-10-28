import type { Response } from 'express';
import type { ApiSuccess } from '@ruya/shared';

export function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  return res.status(status).json(body);
}
