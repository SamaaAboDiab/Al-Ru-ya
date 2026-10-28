import express, { Router, type RequestHandler } from 'express';
import { PROFILE_PHOTO_MAX_BYTES, PROFILE_PHOTO_TYPES } from '@ruya/shared';
import type { Config } from '../../config';
import { requireAuth } from '../../middlewares/auth';
import * as controller from './photos.controller';

/** Mounted under /api/users. Everyone sets only their own photo; reading is limited to family. */
export function photoRoutes(config: Config, uploadLimiter: RequestHandler) {
  const router = Router();
  const rawImage = express.raw({ type: [...PROFILE_PHOTO_TYPES], limit: PROFILE_PHOTO_MAX_BYTES });

  router.use(requireAuth(config.JWT_SECRET));
  router.put('/me/photo', uploadLimiter, rawImage, controller.update);
  router.delete('/me/photo', controller.remove);
  router.get('/:userId/photo', controller.show);

  return router;
}
