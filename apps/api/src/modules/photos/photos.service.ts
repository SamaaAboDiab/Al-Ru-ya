import { isValidObjectId } from 'mongoose';
import { ERROR_CODES, type ParentSummary, type ProfilePhotoType } from '@ruya/shared';
import { ChildModel } from '../../models/Child';
import { ProfilePhotoModel } from '../../models/ProfilePhoto';
import { UserModel } from '../../models/User';
import type { AuthUser } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';

/** The versioned URL the web app loads a photo from, or nothing when there is no photo. */
export function photoUrl(userId: unknown, photoAt?: Date | null) {
  return photoAt ? `/api/users/${String(userId)}/photo?v=${photoAt.getTime()}` : undefined;
}

export function toParentSummary(p: { _id: unknown; name: string; role: string; photoAt?: Date | null }): ParentSummary {
  const url = photoUrl(p._id, p.photoAt);
  return { id: String(p._id), name: p.name, role: p.role as ParentSummary['role'], ...(url ? { photoUrl: url } : {}) };
}

/**
 * The type is read from the file's first bytes, never from the request's header,
 * so a script or SVG renamed to .png is rejected.
 */
export function sniffImageType(bytes: Buffer): ProfilePhotoType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export async function setPhoto(user: AuthUser, body: unknown) {
  const bytes = Buffer.isBuffer(body) ? body : null;
  const contentType = bytes ? sniffImageType(bytes) : null;
  if (!bytes || !contentType) {
    throw new AppError(400, ERROR_CODES.PHOTO_INVALID, 'Send a JPEG, PNG or WebP image');
  }
  await ProfilePhotoModel.updateOne({ user: user.id }, { data: bytes, contentType }, { upsert: true });
  const photoAt = new Date();
  await UserModel.updateOne({ _id: user.id }, { photoAt });
  return { photoUrl: photoUrl(user.id, photoAt)! };
}

export async function removePhoto(user: AuthUser) {
  await Promise.all([
    ProfilePhotoModel.deleteOne({ user: user.id }),
    UserModel.updateOne({ _id: user.id }, { $unset: { photoAt: 1 } }),
  ]);
}

/**
 * A photo is visible to its owner and to anyone who shares a child with them:
 * the child's parents and the child's own account. Everyone else gets 404.
 */
export async function getPhoto(viewer: AuthUser, userId: string) {
  if (!isValidObjectId(userId)) throw AppError.notFound('Photo');
  const isMine = viewer.id === userId;
  const [family, photo] = await Promise.all([
    isMine
      ? true
      : ChildModel.exists({
          $and: [
            { $or: [{ parents: viewer.id }, { account: viewer.id }] },
            { $or: [{ parents: userId }, { account: userId }] },
          ],
        }),
    // Not lean: a hydrated document gives the bytes back as a Buffer rather than a BSON Binary.
    ProfilePhotoModel.findOne({ user: userId }),
  ]);
  if (!family || !photo) throw AppError.notFound('Photo');
  return { data: Buffer.from(photo.data), contentType: photo.contentType };
}
