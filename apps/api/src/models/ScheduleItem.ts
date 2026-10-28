import { Schema, model, type InferSchemaType } from 'mongoose';
import { SCHEDULE_DAYS } from '@ruya/shared';

const scheduleItemSchema = new Schema(
  {
    child: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    activity: { type: String, required: true, trim: true },
    day: { type: String, required: true, enum: SCHEDULE_DAYS },
    /** "HH:MM", 24-hour, in the family's local time. */
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    location: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export type ScheduleItem = InferSchemaType<typeof scheduleItemSchema>;
export const ScheduleItemModel = model('ScheduleItem', scheduleItemSchema);
