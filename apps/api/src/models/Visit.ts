import { Schema, model, type InferSchemaType } from 'mongoose';
import { CANCEL_REASONS, ROLES, VISIT_ACTIONS } from '@ruya/shared';

const historySchema = new Schema(
  {
    action: { type: String, required: true, enum: VISIT_ACTIONS },
    at: { type: Date, required: true },
    by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** Name and role as they were at the time, so the log reads correctly later. */
    byName: { type: String, required: true },
    byRole: { type: String, required: true, enum: Object.values(ROLES) },
  },
  { _id: false },
);

/**
 * US-09..13. Visits are never deleted; every change appends to `history`.
 * Status is derived: cancelled > confirmed > upcoming (before start) > pending.
 */
const visitSchema = new Schema(
  {
    child: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    /** The parent the child is with for this visit. */
    parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** YYYY-MM-DD and HH:MM in the family's time zone. */
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    confirmedAt: { type: Date },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: {
      code: { type: String, enum: CANCEL_REASONS },
      note: { type: String },
    },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

visitSchema.index({ child: 1, date: -1, startTime: -1 });

export type Visit = InferSchemaType<typeof visitSchema>;
export const VisitModel = model('Visit', visitSchema);
