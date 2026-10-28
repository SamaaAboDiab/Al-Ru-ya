import { z } from 'zod';
import {
  CANCEL_NOTE_MAX,
  CANCEL_REASONS,
  DAILY_ITEMS,
  LOCALES,
  MESSAGE_MAX_LENGTH,
  PARENT_ROLES,
  PASSWORD_MIN_LENGTH,
  SCHEDULE_DAYS,
} from './constants';
import { isIsoDate } from './dates';

const email = z.string().trim().toLowerCase().pipe(z.email('EMAIL_INVALID'));
const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, 'PASSWORD_TOO_SHORT')
  .max(128, 'PASSWORD_TOO_LONG');
const name = z.string().trim().min(1, 'NAME_REQUIRED').max(80, 'NAME_TOO_LONG');

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'DATE_INVALID')
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), 'DATE_INVALID')
  .refine((v) => new Date(`${v}T00:00:00Z`) <= new Date(), 'DATE_IN_FUTURE');

/** US-01 */
export const registerParentSchema = z.object({
  name,
  email,
  password,
  role: z.enum(PARENT_ROLES, 'ROLE_REQUIRED'),
  locale: z.enum(LOCALES).optional(),
});
export type RegisterParentInput = z.infer<typeof registerParentSchema>;

/** US-01 / US-03 */
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'PASSWORD_REQUIRED').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Forgot password: the reply is the same whether or not the email has an account. */
export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'RESET_LINK_INVALID').max(200, 'RESET_LINK_INVALID'),
  password,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Sign in with an emailed link instead of a password. Newcomers get a link that starts an account. */
export const emailLinkSchema = z.object({
  email,
  locale: z.enum(LOCALES).optional(),
  /** Where to go after signing in, carried in the link. Same-site paths only. */
  next: z
    .string()
    .max(300)
    .regex(/^\/(?![/\\])/, 'NEXT_INVALID')
    .optional(),
});
export type EmailLinkInput = z.infer<typeof emailLinkSchema>;

export const linkTokenSchema = z.object({
  token: z.string().min(20, 'LINK_INVALID').max(200, 'LINK_INVALID'),
});
export type LinkTokenInput = z.infer<typeof linkTokenSchema>;

/**
 * The last step for someone who proved who they are with a link, Google or a phone code
 * but has no account yet. Email is asked only when that proof didn't include one.
 */
export const completeSignupSchema = z.object({
  name,
  role: z.enum(PARENT_ROLES, 'ROLE_REQUIRED'),
  email: email.optional(),
  locale: z.enum(LOCALES).optional(),
});
export type CompleteSignupInput = z.infer<typeof completeSignupSchema>;

/** Child profile, managed by the parents (any age). */
export const createChildSchema = z.object({
  name,
  birthDate: isoDate,
});
export type CreateChildInput = z.infer<typeof createChildSchema>;

/** US-02 */
export const createChildAccountSchema = z.object({
  email,
  password,
});
export type CreateChildAccountInput = z.infer<typeof createChildAccountSchema>;

/** US-04 */
export const createInvitationSchema = z.object({ email });

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'TIME_INVALID');

/** US-06: one weekly activity. Times are "HH:MM", 24-hour. */
export const scheduleItemSchema = z
  .object({
    activity: z.string().trim().min(1, 'ACTIVITY_REQUIRED').max(60, 'ACTIVITY_TOO_LONG'),
    day: z.enum(SCHEDULE_DAYS, 'DAY_REQUIRED'),
    startTime: time,
    endTime: time,
    location: z
      .string()
      .trim()
      .max(80, 'LOCATION_TOO_LONG')
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .refine((v) => v.endTime > v.startTime, { message: 'END_BEFORE_START', path: ['endTime'] });
export type ScheduleItemInput = z.infer<typeof scheduleItemSchema>;

/** US-07: the full set of items checked today. Unchecking means leaving it out. */
export const dailyLogSchema = z.object({
  items: z
    .array(z.enum(DAILY_ITEMS, 'ITEM_INVALID'))
    .max(DAILY_ITEMS.length)
    .refine((items) => new Set(items).size === items.length, 'ITEM_DUPLICATE'),
});
export type DailyLogInput = z.infer<typeof dailyLogSchema>;

const anyDate = z.string().refine(isIsoDate, 'DATE_INVALID');
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'PARENT_REQUIRED');

/** US-09: the child logs a visit with one of their parents. */
export const visitSchema = z
  .object({
    parentId: objectId,
    date: anyDate,
    startTime: time,
    endTime: time.optional().or(z.literal('').transform(() => undefined)),
  })
  .refine((v) => !v.endTime || v.endTime > v.startTime, { message: 'END_BEFORE_START', path: ['endTime'] });
export type VisitInput = z.infer<typeof visitSchema>;

/** US-11: a reason is required: one from the list, or a short note (required for "other"). */
const reasonFields = {
  reasonCode: z.enum(CANCEL_REASONS, 'REASON_REQUIRED').optional(),
  note: z
    .string()
    .trim()
    .max(CANCEL_NOTE_MAX, 'NOTE_TOO_LONG')
    .optional()
    .transform((v) => (v ? v : undefined)),
};
type ReasonFields = { reasonCode?: string; note?: string };
const hasReason = (v: ReasonFields) => Boolean(v.note) || (Boolean(v.reasonCode) && v.reasonCode !== 'other');

export const cancelVisitSchema = z
  .object(reasonFields)
  .refine(hasReason, { message: 'REASON_REQUIRED', path: ['reasonCode'] });
export type CancelVisitInput = z.infer<typeof cancelVisitSchema>;

/** US-11: "I can't visit" for a date the child hasn't logged. */
export const cantVisitSchema = z
  .object({ ...reasonFields, date: anyDate, startTime: time })
  .refine(hasReason, { message: 'REASON_REQUIRED', path: ['reasonCode'] });
export type CantVisitInput = z.infer<typeof cantVisitSchema>;

/** US-14/15 */
export const messageSchema = z.object({
  body: z.string().trim().min(1, 'MESSAGE_REQUIRED').max(MESSAGE_MAX_LENGTH, 'MESSAGE_TOO_LONG'),
});
export type MessageInput = z.infer<typeof messageSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
