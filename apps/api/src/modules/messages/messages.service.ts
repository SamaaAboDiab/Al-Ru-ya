import { isValidObjectId } from 'mongoose';
import {
  MESSAGES_PAGE_SIZE,
  ROLES,
  type ConversationSummaryDTO,
  type MessageDTO,
  type ParentSummary,
  type Role,
} from '@ruya/shared';
import { MessageModel, type Message } from '../../models/Message';
import { UserModel } from '../../models/User';
import type { AuthUser } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';
import { findAccessibleChild } from '../children/children.service';

/**
 * US-14: who may use the conversation (child, parent).
 * The child may use any conversation with a linked parent; a parent only their own.
 * Anything else is 404, so a parent can't even learn the other conversation's contents exist.
 */
async function openConversation(user: AuthUser, childId: string, parentId: string) {
  const child = await findAccessibleChild(user, childId);
  if (!isValidObjectId(parentId) || !child.parents.some((p) => String(p) === parentId)) {
    throw AppError.notFound('Conversation');
  }
  if (user.role !== ROLES.CHILD && user.id !== parentId) throw AppError.notFound('Conversation');
  return { child, parentId };
}

function toDTO(m: Message & { _id: unknown; createdAt: Date }, user: AuthUser): MessageDTO {
  return {
    id: String(m._id),
    body: m.body,
    senderRole: m.senderRole as Role,
    fromMe: String(m.sender) === user.id,
    createdAt: m.createdAt.toISOString(),
    read: Boolean(m.readAt),
  };
}

/** The child sees one row per linked parent; a parent sees only their own row. */
export async function listConversations(user: AuthUser, childId: string): Promise<ConversationSummaryDTO[]> {
  const child = await findAccessibleChild(user, childId);
  const parentIds = user.role === ROLES.CHILD ? child.parents.map(String) : [user.id];
  const parents = await UserModel.find({ _id: { $in: parentIds } }).select('name role').lean();

  return Promise.all(
    parents.map(async (p) => {
      const pair = { child: child._id, parent: p._id };
      const [last, unread] = await Promise.all([
        MessageModel.findOne(pair).sort({ createdAt: -1 }).lean(),
        MessageModel.countDocuments({ ...pair, sender: { $ne: user.id }, readAt: { $exists: false } }),
      ]);
      return {
        parent: { id: String(p._id), name: p.name, role: p.role as ParentSummary['role'] },
        ...(last
          ? { lastMessage: { body: last.body, createdAt: last.createdAt.toISOString(), fromMe: String(last.sender) === user.id } }
          : {}),
        unread,
      };
    }),
  );
}

/**
 * Newest page, returned oldest-first for display. `before` is a message id: ids grow in
 * creation order and are unique, so paging never skips messages sent in the same millisecond.
 */
export async function listMessages(user: AuthUser, childId: string, parentId: string, before?: string) {
  const { child } = await openConversation(user, childId, parentId);
  const page = await MessageModel.find({
    child: child._id,
    parent: parentId,
    ...(before && isValidObjectId(before) ? { _id: { $lt: before } } : {}),
  })
    .sort({ _id: -1 })
    .limit(MESSAGES_PAGE_SIZE)
    .lean();
  return page.reverse().map((m) => toDTO(m, user));
}

/** US-14/15: either side of the pair can write; parents' encouragement is just a message. */
export async function sendMessage(user: AuthUser, childId: string, parentId: string, body: string) {
  const { child } = await openConversation(user, childId, parentId);
  const message = await MessageModel.create({
    child: child._id,
    parent: parentId,
    sender: user.id,
    senderRole: user.role,
    body,
  });
  return toDTO(message.toObject(), user);
}

/** Marks the other side's messages in this conversation as read. */
export async function markConversationRead(user: AuthUser, childId: string, parentId: string) {
  const { child } = await openConversation(user, childId, parentId);
  await MessageModel.updateMany(
    { child: child._id, parent: parentId, sender: { $ne: user.id }, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
}
