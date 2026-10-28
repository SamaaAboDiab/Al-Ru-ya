import { isValidObjectId, type Types } from 'mongoose';
import type { CancelReason, NotificationDTO, NotificationListDTO, NotificationType, Role } from '@ruya/shared';
import { NotificationModel, type Notification } from '../../models/Notification';
import type { AuthUser } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';

const PAGE_SIZE = 30;

type ChildForNotify = { _id: Types.ObjectId; name: string; parents: Types.ObjectId[]; account?: Types.ObjectId | null };
type VisitForNotify = {
  _id: Types.ObjectId;
  date: string;
  startTime: string;
  cancelReason?: { code?: string | null; note?: string | null } | null;
};

/**
 * US-11/12: tells every linked parent and the child's own account, except whoever acted.
 * Notifications are one-way: there is no reply.
 */
export async function notifyVisit(
  type: NotificationType,
  child: ChildForNotify,
  visit: VisitForNotify,
  actor: { id: string; name: string; role: Role },
) {
  const recipients = new Set([...child.parents.map(String), ...(child.account ? [String(child.account)] : [])]);
  recipients.delete(actor.id);
  if (recipients.size === 0) return;

  const reason = visit.cancelReason?.code || visit.cancelReason?.note ? visit.cancelReason : undefined;
  await NotificationModel.insertMany(
    [...recipients].map((recipient) => ({
      recipient,
      type,
      child: child._id,
      visit: visit._id,
      actor: actor.id,
      childName: child.name,
      actorName: actor.name,
      actorRole: actor.role,
      visitDate: visit.date,
      visitTime: visit.startTime,
      ...(reason ? { reason } : {}),
    })),
  );
}

function toDTO(n: Notification & { _id: unknown; createdAt: Date }): NotificationDTO {
  const reason = n.reason?.code || n.reason?.note ? n.reason : undefined;
  return {
    id: String(n._id),
    type: n.type as NotificationType,
    childId: String(n.child),
    childName: n.childName,
    visitId: String(n.visit),
    actorName: n.actorName,
    actorRole: n.actorRole as Role,
    visitDate: n.visitDate,
    visitTime: n.visitTime,
    ...(reason
      ? { reason: { ...(reason.code ? { code: reason.code as CancelReason } : {}), ...(reason.note ? { note: reason.note } : {}) } }
      : {}),
    createdAt: n.createdAt.toISOString(),
    read: Boolean(n.readAt),
  };
}

export async function listNotifications(user: AuthUser): Promise<NotificationListDTO> {
  const [items, unread] = await Promise.all([
    NotificationModel.find({ recipient: user.id }).sort({ createdAt: -1 }).limit(PAGE_SIZE).lean(),
    NotificationModel.countDocuments({ recipient: user.id, readAt: { $exists: false } }),
  ]);
  return { items: items.map(toDTO), unread };
}

export async function markRead(user: AuthUser, id: string) {
  if (!isValidObjectId(id)) throw AppError.notFound('Notification');
  const result = await NotificationModel.updateOne(
    { _id: id, recipient: user.id, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
  if (result.matchedCount === 0 && !(await NotificationModel.exists({ _id: id, recipient: user.id }))) {
    throw AppError.notFound('Notification');
  }
}

export async function markAllRead(user: AuthUser) {
  await NotificationModel.updateMany(
    { recipient: user.id, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
}
