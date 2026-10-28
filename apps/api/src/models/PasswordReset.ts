import { Schema, model, type InferSchemaType } from 'mongoose';

const passwordResetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** SHA-256 of the token in the emailed link. The raw token is never stored. */
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    /** Set when the link is used, so it works only once. */
    usedAt: { type: Date },
  },
  { timestamps: true },
);

// MongoDB removes spent links a day after they expire; until then they still read as expired.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export type PasswordReset = InferSchemaType<typeof passwordResetSchema>;
export const PasswordResetModel = model('PasswordReset', passwordResetSchema);
