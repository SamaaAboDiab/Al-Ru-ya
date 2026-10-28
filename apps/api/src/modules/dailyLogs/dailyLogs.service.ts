import {
  DAILY_ITEMS,
  ERROR_CODES,
  ROLES,
  isIsoDate,
  todayIn,
  type DailyItem,
  type DailyLogDTO,
} from '@ruya/shared';
import { DailyLogModel } from '../../models/DailyLog';
import type { AuthUser } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';
import { findAccessibleChild } from '../children/children.service';

type StoredEntry = { item: string; doneAt: Date };

function assertDate(date: string) {
  if (!isIsoDate(date)) throw new AppError(400, ERROR_CODES.VALIDATION_FAILED, 'Invalid date', { date: 'DATE_INVALID' });
}

function toDTO(
  user: AuthUser,
  date: string,
  log: { entries: StoredEntry[]; updatedAt: Date } | null,
  now: Date,
): DailyLogDTO {
  const today = todayIn(undefined, now);
  const order = (item: string) => DAILY_ITEMS.indexOf(item as DailyItem);
  return {
    date,
    today,
    entries: (log?.entries ?? [])
      .slice()
      .sort((a, b) => order(a.item) - order(b.item))
      .map((e) => ({ item: e.item as DailyItem, doneAt: e.doneAt.toISOString() })),
    updatedAt: log?.updatedAt.toISOString() ?? null,
    editable: user.role === ROLES.CHILD && date === today,
  };
}

/** US-08: linked parents (and the child) read any day's log. */
export async function getDailyLog(user: AuthUser, childId: string, date: string, now = new Date()) {
  assertDate(date);
  const child = await findAccessibleChild(user, childId);
  const log = await DailyLogModel.findOne({ child: child._id, date }).lean();
  return toDTO(user, date, log, now);
}

/**
 * US-07: the child saves today's checklist. Past days are locked.
 * Items that stay checked keep their original time; newly checked ones get `now`.
 */
export async function saveDailyLog(user: AuthUser, childId: string, date: string, items: DailyItem[], now = new Date()) {
  assertDate(date);
  const child = await findAccessibleChild(user, childId);
  if (date !== todayIn(undefined, now)) {
    throw new AppError(403, ERROR_CODES.DAY_LOCKED, 'Only today can be changed');
  }

  const existing = await DailyLogModel.findOne({ child: child._id, date }).lean();
  const previous = new Map((existing?.entries ?? []).map((e) => [e.item, e.doneAt]));
  const entries = items.map((item) => ({ item, doneAt: previous.get(item) ?? now }));

  const log = await DailyLogModel.findOneAndUpdate(
    { child: child._id, date },
    { $set: { entries, updatedBy: user.id } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return toDTO(user, date, log, now);
}
