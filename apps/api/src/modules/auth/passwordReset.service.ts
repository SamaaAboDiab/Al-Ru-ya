import { createHash, randomBytes } from 'node:crypto';
import {
  ERROR_CODES,
  PASSWORD_RESET_TTL_MINUTES,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@ruya/shared';
import { PasswordResetModel } from '../../models/PasswordReset';
import { UserModel } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type { Logger } from '../../utils/logger';
import type { Mailer } from '../../utils/mailer';
import { hashPassword } from './auth.service';

export interface ResetDeps {
  mailer: Mailer;
  logger: Logger;
  webOrigin: string;
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

function resetEmail(name: string, url: string, locale: string) {
  if (locale === 'en') {
    return {
      subject: "Reset your Al-Ru'ya password",
      text: `Hi ${name},\n\nOpen this link to choose a new password. It works once, for ${PASSWORD_RESET_TTL_MINUTES} minutes:\n${url}\n\nIf you didn't ask for this, ignore this email; your password stays the same.`,
    };
  }
  return {
    subject: 'تغيير باسورد الرؤية',
    text: `أهلاً ${name}،\n\nافتح اللينك ده عشان تختار باسورد جديد. اللينك بيشتغل مرة واحدة، لمدة ${PASSWORD_RESET_TTL_MINUTES} دقيقة:\n${url}\n\nلو مش انت اللي طلبت ده، تجاهل الإيميل، والباسورد بتاعك هيفضل زي ما هو.`,
  };
}

/**
 * Emails a one-time link when the email has an account. The caller always gets the same
 * empty reply, and the email goes out after replying, so neither the answer nor its timing
 * tells anyone whether an account exists.
 */
export async function requestPasswordReset(input: ForgotPasswordInput, deps: ResetDeps, now: Date = new Date()) {
  const user = await UserModel.findOne({ email: input.email }).select('name email locale').lean();
  if (!user) return;

  // Only the newest link works.
  await PasswordResetModel.deleteMany({ user: user._id, usedAt: { $exists: false } });
  const token = randomBytes(32).toString('base64url');
  await PasswordResetModel.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
  });

  const message = resetEmail(user.name, `${deps.webOrigin}/reset-password/${token}`, user.locale ?? 'ar');
  void deps.mailer.send({ to: user.email, ...message }).catch((err: unknown) => {
    deps.logger.error({ err, userId: String(user._id) }, 'Password reset email failed');
  });
}

/** Spends the link (atomically, so it can't be used twice) and sets the new password. */
export async function resetPassword(input: ResetPasswordInput, now: Date = new Date()) {
  const reset = await PasswordResetModel.findOneAndUpdate(
    { tokenHash: hashToken(input.token), usedAt: { $exists: false }, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
  ).lean();
  if (!reset) throw new AppError(400, ERROR_CODES.RESET_LINK_INVALID, 'This link is invalid or has expired');

  await UserModel.updateOne({ _id: reset.user }, { passwordHash: await hashPassword(input.password) });
  await PasswordResetModel.deleteMany({ user: reset.user, usedAt: { $exists: false } });
}
