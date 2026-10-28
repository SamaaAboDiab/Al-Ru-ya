import { Schema, model, type InferSchemaType } from 'mongoose';
import { DAILY_ITEMS } from '@ruya/shared';

const entrySchema = new Schema(
  {
    item: { type: String, required: true, enum: DAILY_ITEMS },
    /** When the child checked it. Kept as-is if the same item is saved again. */
    doneAt: { type: Date, required: true },
  },
  { _id: false },
);

const dailyLogSchema = new Schema(
  {
    child: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    /** YYYY-MM-DD in the family's time zone. */
    date: { type: String, required: true },
    entries: { type: [entrySchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

dailyLogSchema.index({ child: 1, date: 1 }, { unique: true });

export type DailyLog = InferSchemaType<typeof dailyLogSchema>;
export const DailyLogModel = model('DailyLog', dailyLogSchema);
