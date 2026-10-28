import { isValidObjectId, type Types } from 'mongoose';
import {
  ERROR_CODES,
  NOTIFICATION_TYPES,
  ROLES,
  VISIT_STATUSES,
  nowIn,
  todayIn,
  type CancelReason,
  type CancelVisitInput,
  type CantVisitInput,
  type ParentSummary,
  type Role,
  type VisitAction,
  type VisitDTO,
  type VisitInput,
  type VisitStatus,
} from '@ruya/shared';
import { UserModel } from '../../models/User';
import { VisitModel, type Visit } from '../../models/Visit';
import type { AuthUser } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';
import { findAccessibleChild } from '../children/children.service';
import { notifyVisit } from '../notifications/notifications.service';

const MAX_LISTED = 200;

type PopulatedParent = { _id: Types.ObjectId; name: string; role: string };
type VisitDoc = Omit<Visit, 'parent'> & { _id: Types.ObjectId; parent: PopulatedParent; createdAt: Date };
type Actor = { id: string; name: string; role: Role };

export function visitStatus(v: Pick<Visit, 'date' | 'startTime' | 'confirmedAt' | 'cancelledAt'>, now: Date): VisitStatus {
  if (v.cancelledAt) return VISIT_STATUSES.CANCELLED;
  if (v.confirmedAt) return VISIT_STATUSES.CONFIRMED;
  const local = nowIn(undefined, now);
  const started = v.date < local.date || (v.date === local.date && v.startTime <= local.time);
  return started ? VISIT_STATUSES.PENDING : VISIT_STATUSES.UPCOMING;
}

function toDTO(v: VisitDoc, user: AuthUser, now: Date): VisitDTO {
  const status = visitStatus(v, now);
  const open = status === VISIT_STATUSES.UPCOMING || status === VISIT_STATUSES.PENDING;
  const isVisitParent = String(v.parent._id) === user.id;
  const code = v.cancelReason?.code ?? undefined;
  const note = v.cancelReason?.note ?? undefined;
  return {
    id: String(v._id),
    childId: String(v.child),
    parent: { id: String(v.parent._id), name: v.parent.name, role: v.parent.role as ParentSummary['role'] },
    date: v.date,
    startTime: v.startTime,
    ...(v.endTime ? { endTime: v.endTime } : {}),
    status,
    ...(code || note
      ? { cancelReason: { ...(code ? { code: code as CancelReason } : {}), ...(note ? { note } : {}) } }
      : {}),
    history: v.history.map((h) => ({
      action: h.action as VisitAction,
      at: h.at.toISOString(),
      byName: h.byName,
      byRole: h.byRole as Role,
    })),
    // US-09: the child edits their own entry on the day they logged it, while it is still open.
    canEdit:
      user.role === ROLES.CHILD &&
      String(v.createdBy) === user.id &&
      open &&
      todayIn(undefined, v.createdAt) === todayIn(undefined, now),
    // US-10: only the parent the child is with, once the visit has started.
    canConfirm: isVisitParent && status === VISIT_STATUSES.PENDING,
    canCancel: isVisitParent && open,
  };
}

async function loadActor(user: AuthUser): Promise<Actor> {
  const me = await UserModel.findById(user.id).select('name role').lean();
  if (!me) throw AppError.unauthenticated();
  return { id: user.id, name: me.name, role: me.role as Role };
}

function historyEntry(action: VisitAction, actor: Actor, at: Date) {
  return { action, at, by: actor.id, byName: actor.name, byRole: actor.role };
}

function assertLinkedParent(child: { parents: Types.ObjectId[] }, parentId: string) {
  if (!child.parents.some((p) => String(p) === parentId)) {
    throw new AppError(400, ERROR_CODES.VALIDATION_FAILED, 'Pick one of your parents', { parentId: 'PARENT_REQUIRED' });
  }
}

async function loadVisit(childId: Types.ObjectId, visitId: string): Promise<VisitDoc> {
  if (!isValidObjectId(visitId)) throw AppError.notFound('Visit');
  const visit = await VisitModel.findOne({ _id: visitId, child: childId })
    .populate<{ parent: PopulatedParent }>('parent', 'name role')
    .lean();
  if (!visit) throw AppError.notFound('Visit');
  return visit as VisitDoc;
}

/** US-13: everything, newest first. Linked parents and the child can read it. */
export async function listVisits(user: AuthUser, childId: string, now = new Date()) {
  const child = await findAccessibleChild(user, childId);
  const visits = await VisitModel.find({ child: child._id })
    .sort({ date: -1, startTime: -1 })
    .limit(MAX_LISTED)
    .populate<{ parent: PopulatedParent }>('parent', 'name role')
    .lean();
  return (visits as VisitDoc[]).map((v) => toDTO(v, user, now));
}

export async function getVisit(user: AuthUser, childId: string, visitId: string, now = new Date()) {
  const child = await findAccessibleChild(user, childId);
  return toDTO(await loadVisit(child._id, visitId), user, now);
}

/** US-09: the child logs a visit; both parents see it and get notified. */
export async function logVisit(user: AuthUser, childId: string, input: VisitInput, now = new Date()) {
  const child = await findAccessibleChild(user, childId);
  assertLinkedParent(child, input.parentId);
  const actor = await loadActor(user);

  const created = await VisitModel.create({
    child: child._id,
    parent: input.parentId,
    date: input.date,
    startTime: input.startTime,
    ...(input.endTime ? { endTime: input.endTime } : {}),
    createdBy: user.id,
    history: [historyEntry('created', actor, now)],
  });
  await notifyVisit(NOTIFICATION_TYPES.VISIT_LOGGED, child, created, actor);
  return getVisit(user, childId, String(created._id), now);
}

/** US-09: same-day edits only, and not once the visit is confirmed or cancelled. */
export async function editVisit(user: AuthUser, childId: string, visitId: string, input: VisitInput, now = new Date()) {
  const child = await findAccessibleChild(user, childId);
  const visit = await loadVisit(child._id, visitId);
  const current = toDTO(visit, user, now);
  if (!current.canEdit) {
    const closed = current.status === VISIT_STATUSES.CONFIRMED || current.status === VISIT_STATUSES.CANCELLED;
    throw closed
      ? new AppError(409, ERROR_CODES.VISIT_CLOSED, 'This visit is already closed')
      : new AppError(403, ERROR_CODES.VISIT_LOCKED, 'A visit can only be edited on the day it was logged');
  }
  assertLinkedParent(child, input.parentId);
  const actor = await loadActor(user);

  const fields = {
    parent: input.parentId,
    date: input.date,
    startTime: input.startTime,
    ...(input.endTime ? { endTime: input.endTime } : {}),
  };
  const updated = await VisitModel.updateOne(
    { _id: visit._id, confirmedAt: { $exists: false }, cancelledAt: { $exists: false } },
    {
      $set: fields,
      ...(input.endTime ? {} : { $unset: { endTime: 1 } }),
      $push: { history: historyEntry('edited', actor, now) },
    },
  );
  if (updated.modifiedCount === 0) throw new AppError(409, ERROR_CODES.VISIT_CLOSED, 'This visit is already closed');
  return getVisit(user, childId, visitId, now);
}

function assertVisitParent(visit: VisitDoc, user: AuthUser) {
  if (String(visit.parent._id) !== user.id) {
    throw new AppError(403, ERROR_CODES.NOT_VISIT_PARENT, 'Only the parent this visit is with can do this');
  }
}

/** US-10: the parent the child is with confirms it; recorded with time and author. */
export async function confirmVisit(user: AuthUser, childId: string, visitId: string, now = new Date()) {
  const child = await findAccessibleChild(user, childId);
  const visit = await loadVisit(child._id, visitId);
  assertVisitParent(visit, user);
  const status = visitStatus(visit, now);
  if (status === VISIT_STATUSES.UPCOMING) {
    throw new AppError(409, ERROR_CODES.VISIT_NOT_STARTED, 'The visit has not started yet');
  }
  if (status !== VISIT_STATUSES.PENDING) throw new AppError(409, ERROR_CODES.VISIT_CLOSED, 'This visit is already closed');

  const actor = await loadActor(user);
  const updated = await VisitModel.updateOne(
    { _id: visit._id, confirmedAt: { $exists: false }, cancelledAt: { $exists: false } },
    {
      $set: { confirmedAt: now, confirmedBy: user.id },
      $push: { history: historyEntry('confirmed', actor, now) },
    },
  );
  if (updated.modifiedCount === 0) throw new AppError(409, ERROR_CODES.VISIT_CLOSED, 'This visit is already closed');
  await notifyVisit(NOTIFICATION_TYPES.VISIT_CONFIRMED, child, visit, actor);
  return getVisit(user, childId, visitId, now);
}

/** US-11: "I can't visit" on an open visit. The visit stays in the log as cancelled. */
export async function cancelVisit(user: AuthUser, childId: string, visitId: string, input: CancelVisitInput, now = new Date()) {
  const child = await findAccessibleChild(user, childId);
  const visit = await loadVisit(child._id, visitId);
  assertVisitParent(visit, user);
  const status = visitStatus(visit, now);
  if (status === VISIT_STATUSES.CONFIRMED || status === VISIT_STATUSES.CANCELLED) {
    throw new AppError(409, ERROR_CODES.VISIT_CLOSED, 'This visit is already closed');
  }

  const actor = await loadActor(user);
  const cancelReason = { ...(input.reasonCode ? { code: input.reasonCode } : {}), ...(input.note ? { note: input.note } : {}) };
  const updated = await VisitModel.updateOne(
    { _id: visit._id, confirmedAt: { $exists: false }, cancelledAt: { $exists: false } },
    {
      $set: { cancelledAt: now, cancelledBy: user.id, cancelReason },
      $push: { history: historyEntry('cancelled', actor, now) },
    },
  );
  if (updated.modifiedCount === 0) throw new AppError(409, ERROR_CODES.VISIT_CLOSED, 'This visit is already closed');
  await notifyVisit(NOTIFICATION_TYPES.VISIT_CANCELLED, child, { ...visit, cancelReason }, actor);
  return getVisit(user, childId, visitId, now);
}

/** US-11: "I can't visit" for a date the child hasn't logged yet. Creates the record as cancelled. */
export async function reportCantVisit(user: AuthUser, childId: string, input: CantVisitInput, now = new Date()) {
  const child = await findAccessibleChild(user, childId);
  const actor = await loadActor(user);
  const cancelReason = { ...(input.reasonCode ? { code: input.reasonCode } : {}), ...(input.note ? { note: input.note } : {}) };

  const created = await VisitModel.create({
    child: child._id,
    parent: user.id,
    date: input.date,
    startTime: input.startTime,
    createdBy: user.id,
    cancelledAt: now,
    cancelledBy: user.id,
    cancelReason,
    history: [historyEntry('created', actor, now), historyEntry('cancelled', actor, now)],
  });
  await notifyVisit(NOTIFICATION_TYPES.VISIT_CANCELLED, child, created, actor);
  return getVisit(user, childId, String(created._id), now);
}
