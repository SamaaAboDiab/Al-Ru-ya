import { createHash, randomBytes } from 'node:crypto';
import {
  ERROR_CODES,
  INVITE_STATUSES,
  INVITE_TTL_DAYS,
  MAX_PARENTS_PER_CHILD,
  type ChildDTO,
  type InvitationDTO,
  type InvitationPreviewDTO,
  type InviteStatus,
} from '@ruya/shared';
import { ChildModel } from '../../models/Child';
import { InvitationModel, type Invitation } from '../../models/Invitation';
import { UserModel } from '../../models/User';
import type { AuthUser } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';
import type { Logger } from '../../utils/logger';
import type { Mailer } from '../../utils/mailer';
import { findAccessibleChild, getChild } from '../children/children.service';

export interface InvitationDeps {
  mailer: Mailer;
  logger: Logger;
  webOrigin: string;
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Pending invitations past their date read as expired; no background job needed. */
function effectiveStatus(inv: Pick<Invitation, 'status' | 'expiresAt'>, now: Date): InviteStatus {
  if (inv.status === INVITE_STATUSES.PENDING && inv.expiresAt <= now) return INVITE_STATUSES.EXPIRED;
  return inv.status as InviteStatus;
}

function toInvitationDTO(inv: Invitation & { _id: unknown }, now: Date): InvitationDTO {
  return {
    id: String(inv._id),
    email: inv.email,
    status: effectiveStatus(inv, now),
    expiresAt: inv.expiresAt.toISOString(),
  };
}

function inviteEmail(inviterName: string, childName: string, url: string, locale: string) {
  if (locale === 'en') {
    return {
      subject: `${inviterName} invited you to follow ${childName} on Al-Ru'ya`,
      text: `${inviterName} invited you to link your account to ${childName} on Al-Ru'ya.\n\nOpen this link to accept (valid for ${INVITE_TTL_DAYS} days):\n${url}`,
    };
  }
  return {
    subject: `${inviterName} بيدعوك تتابع ${childName} على الرؤية`,
    text: `${inviterName} بيدعوك تربط حسابك بـ ${childName} على تطبيق الرؤية.\n\nافتح اللينك ده عشان تقبل الدعوة (صالح لمدة ${INVITE_TTL_DAYS} أيام):\n${url}`,
  };
}

/** US-04: a linked parent invites the other parent by email. */
export async function createInvitation(
  parent: AuthUser,
  childId: string,
  email: string,
  deps: InvitationDeps,
  now: Date = new Date(),
): Promise<InvitationDTO> {
  const child = await findAccessibleChild(parent, childId);
  const inviter = await UserModel.findById(parent.id).select('name email locale').lean();
  if (!inviter) throw AppError.unauthenticated();

  if (inviter.email === email) {
    throw new AppError(422, ERROR_CODES.CANNOT_INVITE_SELF, 'You cannot invite yourself');
  }
  if (child.parents.length >= MAX_PARENTS_PER_CHILD) {
    throw new AppError(409, ERROR_CODES.CHILD_HAS_BOTH_PARENTS, 'Both parents are already linked');
  }
  const invitee = await UserModel.findOne({ email }).select('_id').lean();
  if (invitee && child.parents.some((p) => String(p) === String(invitee._id))) {
    throw new AppError(409, ERROR_CODES.ALREADY_LINKED, 'This person is already linked to the child');
  }

  // A new invitation for the same email replaces the old one.
  await InvitationModel.updateMany(
    { child: child._id, email, status: INVITE_STATUSES.PENDING },
    { $set: { status: INVITE_STATUSES.REVOKED } },
  );

  const token = randomBytes(32).toString('base64url');
  const invitation = await InvitationModel.create({
    child: child._id,
    invitedBy: parent.id,
    email,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  const inviteUrl = `${deps.webOrigin}/invite/${token}`;
  const message = inviteEmail(inviter.name, child.name, inviteUrl, inviter.locale ?? 'ar');
  // The invitation stands even if the email fails: the parent also gets the link to share.
  try {
    await deps.mailer.send({ to: email, ...message });
  } catch (err) {
    deps.logger.error({ err, invitationId: String(invitation._id) }, 'Invitation email failed');
  }

  return { ...toInvitationDTO(invitation.toObject(), now), inviteUrl };
}

export async function listInvitations(parent: AuthUser, childId: string, now: Date = new Date()) {
  const child = await findAccessibleChild(parent, childId);
  const invitations = await InvitationModel.find({ child: child._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return invitations.map((inv) => toInvitationDTO(inv, now));
}

async function findByToken(token: string) {
  const invitation = await InvitationModel.findOne({ tokenHash: hashToken(token) }).lean();
  if (!invitation) throw new AppError(404, ERROR_CODES.INVITE_NOT_FOUND, 'Invitation not found');
  return invitation;
}

/** Shown to whoever holds the link, before they sign in. */
export async function previewInvitation(token: string, now: Date = new Date()): Promise<InvitationPreviewDTO> {
  const invitation = await findByToken(token);
  const [child, inviter] = await Promise.all([
    ChildModel.findById(invitation.child).select('name').lean(),
    UserModel.findById(invitation.invitedBy).select('name').lean(),
  ]);
  if (!child || !inviter) throw new AppError(404, ERROR_CODES.INVITE_NOT_FOUND, 'Invitation not found');
  return {
    childName: child.name,
    inviterName: inviter.name,
    email: invitation.email,
    status: effectiveStatus(invitation, now),
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

/** US-04: the invited parent accepts and is linked to the child. */
export async function acceptInvitation(user: AuthUser, token: string, now: Date = new Date()): Promise<ChildDTO> {
  const invitation = await findByToken(token);
  const status = effectiveStatus(invitation, now);
  if (status === INVITE_STATUSES.EXPIRED) {
    throw new AppError(410, ERROR_CODES.INVITE_EXPIRED, 'This invitation has expired');
  }
  if (status !== INVITE_STATUSES.PENDING) {
    throw new AppError(409, ERROR_CODES.INVITE_USED, 'This invitation is no longer valid');
  }

  const me = await UserModel.findById(user.id).select('email').lean();
  if (!me) throw AppError.unauthenticated();
  // The link only works for the account it was sent to, even if it gets forwarded.
  if (me.email !== invitation.email) {
    throw new AppError(403, ERROR_CODES.INVITE_EMAIL_MISMATCH, 'This invitation was sent to another email');
  }

  const child = await ChildModel.findById(invitation.child).select('parents').lean();
  if (!child) throw new AppError(404, ERROR_CODES.INVITE_NOT_FOUND, 'Invitation not found');
  if (child.parents.some((p) => String(p) === user.id)) {
    throw new AppError(409, ERROR_CODES.ALREADY_LINKED, 'You are already linked to this child');
  }

  // Claim the invitation first so two parallel accepts can't both succeed.
  const claimed = await InvitationModel.updateOne(
    { _id: invitation._id, status: INVITE_STATUSES.PENDING },
    { $set: { status: INVITE_STATUSES.ACCEPTED, acceptedBy: user.id, acceptedAt: now } },
  );
  if (claimed.modifiedCount === 0) {
    throw new AppError(409, ERROR_CODES.INVITE_USED, 'This invitation is no longer valid');
  }

  const linked = await ChildModel.updateOne(
    { _id: invitation.child, [`parents.${MAX_PARENTS_PER_CHILD - 1}`]: { $exists: false } },
    { $addToSet: { parents: user.id } },
  );
  if (linked.modifiedCount === 0) {
    await InvitationModel.updateOne(
      { _id: invitation._id },
      { $set: { status: INVITE_STATUSES.PENDING }, $unset: { acceptedBy: 1, acceptedAt: 1 } },
    );
    throw new AppError(409, ERROR_CODES.CHILD_HAS_BOTH_PARENTS, 'Both parents are already linked');
  }

  return getChild(user, String(invitation.child));
}
