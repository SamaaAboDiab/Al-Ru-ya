import { Schema, model, type InferSchemaType } from 'mongoose';
import { PROFILE_PHOTO_TYPES } from '@ruya/shared';

/**
 * One photo per user, kept apart from the user document so logins and lists never load it.
 * Served only through the API, to the owner and the people who share a child with them.
 */
const profilePhotoSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true, enum: PROFILE_PHOTO_TYPES },
  },
  { timestamps: true },
);

export type ProfilePhoto = InferSchemaType<typeof profilePhotoSchema>;
export const ProfilePhotoModel = model('ProfilePhoto', profilePhotoSchema);
