import { Schema, model, type InferSchemaType } from 'mongoose';
import { INVITE_STATUSES } from '@ruya/shared';

const invitationSchema = new Schema(
  {
    child: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    /** SHA-256 of the token in the link. The raw token is never stored. */
    tokenHash: { type: String, required: true, unique: true, select: false },
    status: {
      type: String,
      enum: Object.values(INVITE_STATUSES),
      default: INVITE_STATUSES.PENDING,
    },
    expiresAt: { type: Date, required: true },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date },
  },
  { timestamps: true },
);

invitationSchema.index({ child: 1, email: 1, status: 1 });

export type Invitation = InferSchemaType<typeof invitationSchema>;
export const InvitationModel = model('Invitation', invitationSchema);
