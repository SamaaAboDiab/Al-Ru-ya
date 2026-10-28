import { randomInt, timingSafeEqual } from 'node:crypto';
import {
  ERROR_CODES,
  PHONE_CODE_LENGTH,
  PHONE_CODE_MAX_ATTEMPTS,
  PHONE_CODE_RESEND_SECONDS,
  PHONE_CODE_TTL_MINUTES,
  PHONE_CODES_PER_HOUR,
  type UserDTO,
} from '@ruya/shared';
import { LoginCodeModel } from '../../models/LoginCode';
import { UserModel } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type { Logger } from '../../utils/logger';
import type { SmsSender } from '../../utils/sms';
import { toUserDTO } from './auth.service';
import { hashSecret, type SignInOutcome } from './passwordless.service';

export interface PhoneDeps {
  sms: SmsSender;
  logger: Logger;
  secret: string;
}

const codeMessage = (code: string, locale: string) =>
  locale === 'en'
    ? `Your Al-Ru'ya code: ${code}. It works for ${PHONE_CODE_TTL_MINUTES} minutes. Don't share it with anyone.`
    : `كود الرؤية: ${code}. صالح لمدة ${PHONE_CODE_TTL_MINUTES} دقايق. ما تقولوش لأي حد.`;

/**
 * Texts a one-time code to an Egyptian mobile. The reply is the same whether or not the number
 * has an account. Each SMS costs money, so a number gets a code at most once a minute and a
 * few times an hour; the route is also rate limited per IP.
 */
export async function sendCode(phone: string, locale: string, deps: PhoneDeps, now: Date = new Date()) {
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recent = await LoginCodeModel.find({ kind: 'phone', target: phone, createdAt: { $gt: hourAgo } })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();
  const last = recent[0]?.createdAt;
  if ((last && now.getTime() - last.getTime() < PHONE_CODE_RESEND_SECONDS * 1000) || recent.length >= PHONE_CODES_PER_HOUR) {
    throw new AppError(429, ERROR_CODES.CODE_TOO_SOON, 'Wait a little before asking for another code');
  }

  // Only the newest code works.
  await LoginCodeModel.updateMany({ kind: 'phone', target: phone, usedAt: { $exists: false } }, { $set: { usedAt: now } });
  const code = String(randomInt(0, 10 ** PHONE_CODE_LENGTH)).padStart(PHONE_CODE_LENGTH, '0');
  await LoginCodeModel.create({
    kind: 'phone',
    target: phone,
    secretHash: hashSecret(code, deps.secret),
    expiresAt: new Date(now.getTime() + PHONE_CODE_TTL_MINUTES * 60 * 1000),
  });

  void deps.sms.send(phone, codeMessage(code, locale)).catch((err: unknown) => {
    deps.logger.error({ err }, 'Phone code SMS failed');
  });
}

/**
 * Checks the newest code for the number. A wrong guess counts against it; after a few it is
 * spent, so six digits can't be guessed. The right code is spent atomically, so it works once.
 */
async function spendCode(phone: string, code: string, secret: string, now: Date) {
  const invalid = () => new AppError(400, ERROR_CODES.CODE_INVALID, 'The code is wrong or has expired');
  const current = await LoginCodeModel.findOne({
    kind: 'phone',
    target: phone,
    usedAt: { $exists: false },
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!current) throw invalid();

  const given = Buffer.from(hashSecret(code, secret));
  const expected = Buffer.from(current.secretHash);
  if (!timingSafeEqual(given, expected)) {
    const attempts = (current.attempts ?? 0) + 1;
    await LoginCodeModel.updateOne(
      { _id: current._id },
      { $set: { attempts, ...(attempts >= PHONE_CODE_MAX_ATTEMPTS ? { usedAt: now } : {}) } },
    );
    throw invalid();
  }

  const spent = await LoginCodeModel.findOneAndUpdate(
    { _id: current._id, usedAt: { $exists: false } },
    { $set: { usedAt: now } },
  ).lean();
  if (!spent) throw invalid();
}

/** Signs in the account with this number, or starts a newcomer's draft (they still give an email). */
export async function verifyCode(
  phone: string,
  code: string,
  secret: string,
  now: Date = new Date(),
): Promise<SignInOutcome> {
  await spendCode(phone, code, secret, now);
  const user = await UserModel.findOne({ phone }).lean();
  return user ? { user: toUserDTO(user) } : { draft: { phone, emailVerified: false } };
}

/**
 * Adds (or replaces) the signed-in person's number, once they prove they have it. The code is
 * checked first, so only the number's owner can learn that it already belongs to an account.
 */
export async function linkPhone(userId: string, phone: string, code: string, secret: string, now: Date = new Date()) {
  await spendCode(phone, code, secret, now);
  const owner = await UserModel.findOne({ phone }).select('_id').lean();
  if (owner && String(owner._id) !== userId) {
    throw new AppError(409, ERROR_CODES.PHONE_TAKEN, 'This number belongs to another account');
  }
  const user = await UserModel.findByIdAndUpdate(userId, { phone }, { new: true }).lean();
  if (!user) throw AppError.unauthenticated();
  return toUserDTO(user);
}

export async function unlinkPhone(userId: string): Promise<UserDTO> {
  const user = await UserModel.findByIdAndUpdate(userId, { $unset: { phone: 1 } }, { new: true }).lean();
  if (!user) throw AppError.unauthenticated();
  return toUserDTO(user);
}
