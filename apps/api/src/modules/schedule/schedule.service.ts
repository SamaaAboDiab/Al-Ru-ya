import { isValidObjectId } from 'mongoose';
import {
  ERROR_CODES,
  MAX_SCHEDULE_ITEMS,
  SCHEDULE_DAYS,
  type ScheduleDay,
  type ScheduleItemDTO,
  type ScheduleItemInput,
} from '@ruya/shared';
import { ScheduleItemModel, type ScheduleItem } from '../../models/ScheduleItem';
import type { AuthUser } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';
import { findAccessibleChild, withAccessibleChild } from '../children/children.service';

function toDTO(item: ScheduleItem & { _id: unknown; updatedAt: Date }): ScheduleItemDTO {
  return {
    id: String(item._id),
    activity: item.activity,
    day: item.day as ScheduleDay,
    startTime: item.startTime,
    endTime: item.endTime,
    ...(item.location ? { location: item.location } : {}),
    updatedAt: item.updatedAt.toISOString(),
  };
}

const dayIndex = (day: string) => SCHEDULE_DAYS.indexOf(day as ScheduleDay);

/** US-06: both linked parents and the child can read the schedule. */
export async function listSchedule(user: AuthUser, childId: string): Promise<ScheduleItemDTO[]> {
  const { result: items } = await withAccessibleChild(user, childId, () =>
    ScheduleItemModel.find({ child: childId }).limit(MAX_SCHEDULE_ITEMS).lean(),
  );
  return items
    .sort((a, b) => dayIndex(a.day) - dayIndex(b.day) || a.startTime.localeCompare(b.startTime))
    .map(toDTO);
}

/** US-06: only the child edits; the route already limits writes to child accounts. */
export async function addScheduleItem(user: AuthUser, childId: string, input: ScheduleItemInput) {
  const child = await findAccessibleChild(user, childId);
  if ((await ScheduleItemModel.countDocuments({ child: child._id })) >= MAX_SCHEDULE_ITEMS) {
    throw new AppError(422, ERROR_CODES.SCHEDULE_FULL, 'The schedule has reached its limit');
  }
  const item = await ScheduleItemModel.create({ ...pick(input), child: child._id, updatedBy: user.id });
  return toDTO(item.toObject());
}

export async function updateScheduleItem(user: AuthUser, childId: string, itemId: string, input: ScheduleItemInput) {
  const child = await findAccessibleChild(user, childId);
  if (!isValidObjectId(itemId)) throw AppError.notFound('Schedule item');
  const { location, ...rest } = pick(input);
  const item = await ScheduleItemModel.findOneAndUpdate(
    { _id: itemId, child: child._id },
    {
      $set: { ...rest, updatedBy: user.id, ...(location ? { location } : {}) },
      ...(location ? {} : { $unset: { location: 1 } }),
    },
    { new: true, runValidators: true },
  ).lean();
  if (!item) throw AppError.notFound('Schedule item');
  return toDTO(item);
}

export async function deleteScheduleItem(user: AuthUser, childId: string, itemId: string) {
  const child = await findAccessibleChild(user, childId);
  if (!isValidObjectId(itemId)) throw AppError.notFound('Schedule item');
  const result = await ScheduleItemModel.deleteOne({ _id: itemId, child: child._id });
  if (result.deletedCount === 0) throw AppError.notFound('Schedule item');
}

function pick(input: ScheduleItemInput) {
  return {
    activity: input.activity,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
    location: input.location,
  };
}
