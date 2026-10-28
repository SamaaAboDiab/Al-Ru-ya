import { Schema, model, type InferSchemaType } from 'mongoose';
import { CANCEL_REASONS, NOTIFICATION_TYPES, ROLES } from '@ruya/shared';

/** US-12: one in-app notification for one recipient. Text is built by the client from these fields. */
const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: Object.values(NOTIFICATION_TYPES) },
    child: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    visit: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Snapshots, so old notifications still read correctly after renames.
    childName: { type: String, required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true, enum: Object.values(ROLES) },
    visitDate: { type: String, required: true },
    visitTime: { type: String, required: true },
    reason: {
      code: { type: String, enum: CANCEL_REASONS },
      note: { type: String },
    },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema>;
export const NotificationModel = model('Notification', notificationSchema);
