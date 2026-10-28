import { z } from 'zod';
import { LOCALES, PARENT_ROLES, PASSWORD_MIN_LENGTH } from './constants';

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
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
