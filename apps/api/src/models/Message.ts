import { Schema, model, type InferSchemaType } from 'mongoose';
import { ROLES } from '@ruya/shared';

/**
 * US-14/15: a message in the private conversation between one child and one parent.
 * The (child, parent) pair *is* the conversation; the other parent can never read it.
 */
const messageSchema = new Schema(
  {
    child: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    /** The parent side of this conversation. */
    parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, required: true, enum: Object.values(ROLES) },
    body: { type: String, required: true },
    /** When the other side opened it. */
    readAt: { type: Date },
  },
  { timestamps: true },
);

messageSchema.index({ child: 1, parent: 1, _id: -1 });

export type Message = InferSchemaType<typeof messageSchema>;
export const MessageModel = model('Message', messageSchema);
