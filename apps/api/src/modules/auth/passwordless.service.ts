import { createHmac, randomBytes } from 'node:crypto';
import {
  ERROR_CODES,
  LOGIN_LINK_TTL_MINUTES,
  type CompleteSignupInput,
  type EmailLinkInput,
  type UserDTO,
} from '@ruya/shared';
import { LoginCodeModel } from '../../models/LoginCode';
import { UserModel } from '../../models/User';
import type { SignupDraft } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';
import type { Logger } from '../../utils/logger';
import type { Mailer } from '../../utils/mailer';
import { assertEmailFree, toUserDTO } from './auth.service';

export interface PasswordlessDeps {
  mailer: Mailer;
  logger: Logger;
  webOrigin: string;
  /** Keys the hashes of links and codes, so a leaked table can't be checked offline. */
  secret: string;
}

/** Either a known user, or what a newcomer proved so far. */
export type SignInOutcome = { user: UserDTO } | { draft: SignupDraft };

export const hashSecret = (secret: string, key: string) => createHmac('sha256', key).update(secret).digest('hex');

function emailLinkMessage(url: string, locale: string, isNew: boolean, name?: string) {
  const minutes = LOGIN_LINK_TTL_MINUTES;
  if (locale === 'en') {
    return isNew
      ? {
          subject: "Create your Al-Ru'ya account",
          text: `Open this link to finish creating your account. It works once, for ${minutes} minutes:\n${url}\n\nIf you didn't ask for this, ignore this email.`,
        }
      : {
          subject: "Your Al-Ru'ya sign-in link",
          text: `Hi ${name},\n\nOpen this link to sign in. It works once, for ${minutes} minutes:\n${url}\n\nIf you didn't ask for this, ignore this email.`,
        };
  }
  return isNew
    ? {
        subject: 'كمّل حسابك على الرؤية',
        text: `افتح اللينك ده عشان تكمّل إنشاء حسابك. اللينك بيشتغل مرة واحدة، لمدة ${minutes} دقيقة:\n${url}\n\nلو مش انت اللي طلبت ده، تجاهل الإيميل.`,
      }
    : {
        subject: 'لينك الدخول للرؤية',
        text: `أهلاً ${name}،\n\nافتح اللينك ده عشان تدخل. اللينك بيشتغل مرة واحدة، لمدة ${minutes} دقيقة:\n${url}\n\nلو مش انت اللي طلبت ده، تجاهل الإيميل.`,
      };
}

/**
 * Emails a one-time link: a sign-in link for an account, or a "finish your account" link
 * for a new address. The reply is always empty and the email goes out after replying,
 * so this reveals nothing about which emails have accounts.
 */
export async function requestEmailLink(input: EmailLinkInput, deps: PasswordlessDeps, now: Date = new Date()) {
  const user = await UserModel.findOne({ email: input.email }).select('name locale').lean();

  // Only the newest link works.
  await LoginCodeModel.deleteMany({ kind: 'email', target: input.email, usedAt: { $exists: false } });
  const token = randomBytes(32).toString('base64url');
  await LoginCodeModel.create({
    kind: 'email',
    target: input.email,
    secretHash: hashSecret(token, deps.secret),
    expiresAt: new Date(now.getTime() + LOGIN_LINK_TTL_MINUTES * 60 * 1000),
  });

  const url = `${deps.webOrigin}/auth/email/${token}${input.next ? `?next=${encodeURIComponent(input.next)}` : ''}`;
  const message = emailLinkMessage(url, user?.locale ?? input.locale ?? 'ar', !user, user?.name);
  void deps.mailer.send({ to: input.email, ...message }).catch((err: unknown) => {
    deps.logger.error({ err }, 'Sign-in link email failed');
  });
}

/** Spends the link once. The account is looked up now, in case it was created meanwhile. */
export async function verifyEmailLink(token: string, secret: string, now: Date = new Date()): Promise<SignInOutcome> {
  const code = await LoginCodeModel.findOneAndUpdate(
    { kind: 'email', secretHash: hashSecret(token, secret), usedAt: { $exists: false }, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
  ).lean();
  if (!code) throw new AppError(400, ERROR_CODES.LINK_INVALID, 'This link is invalid or has expired');

  const user = await UserModel.findOne({ email: code.target }).lean();
  return user ? { user: toUserDTO(user) } : { draft: { email: code.target, emailVerified: true } };
}

/** Creates the parent account for a newcomer, from what they proved plus what they just typed. */
export async function completeSignup(draft: SignupDraft, input: CompleteSignupInput): Promise<UserDTO> {
  const email = draft.emailVerified ? draft.email : input.email;
  if (!email) {
    throw new AppError(400, ERROR_CODES.VALIDATION_FAILED, 'Email is required', { email: 'EMAIL_INVALID' });
  }
  await assertEmailFree(email);
  const user = await UserModel.create({
    name: input.name,
    email,
    role: input.role,
    locale: input.locale,
    ...(draft.phone ? { phone: draft.phone } : {}),
    ...(draft.googleId ? { googleId: draft.googleId } : {}),
  });
  return toUserDTO(user.toObject());
}
