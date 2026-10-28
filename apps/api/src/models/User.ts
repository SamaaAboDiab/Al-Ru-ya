import { Schema, model, type InferSchemaType } from 'mongoose';
import { LOCALES, DEFAULT_LOCALE, ROLES } from '@ruya/shared';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    /** Missing for accounts made with a link, Google or a phone code until a password is set. */
    passwordHash: { type: String, select: false },
    /** E.164, e.g. +201001234567. Set only once verified with a code. */
    phone: { type: String, unique: true, sparse: true },
    /** Google's stable account id ("sub"), once the person signs in with Google. */
    googleId: { type: String, unique: true, sparse: true, select: false },
    role: { type: String, required: true, enum: Object.values(ROLES) },
    locale: { type: String, enum: LOCALES, default: DEFAULT_LOCALE },
    /** Only for child accounts: the child profile this login belongs to. */
    child: { type: Schema.Types.ObjectId, ref: 'Child' },
    /** When the profile photo last changed; versions the photo URL so browsers fetch the new one. */
    photoAt: { type: Date },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model('User', userSchema);
