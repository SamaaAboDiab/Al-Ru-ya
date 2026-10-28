import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * A one-time proof of an email (a link) or a phone number (a short code).
 * Only a keyed hash of the secret is stored.
 */
const loginCodeSchema = new Schema(
  {
    kind: { type: String, required: true, enum: ['email', 'phone'] },
    /** The address the secret was sent to: an email, or an E.164 phone number. */
    target: { type: String, required: true },
    secretHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    /** Wrong guesses so far; phone codes are short, so they stop working after a few. */
    attempts: { type: Number, default: 0 },
    usedAt: { type: Date },
  },
  { timestamps: true },
);

loginCodeSchema.index({ kind: 1, target: 1, createdAt: -1 });
loginCodeSchema.index({ secretHash: 1 });
// MongoDB removes old codes a day after they expire; until then they still read as expired.
loginCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export type LoginCode = InferSchemaType<typeof loginCodeSchema>;
export const LoginCodeModel = model('LoginCode', loginCodeSchema);
