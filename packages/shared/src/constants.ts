export const ROLES = {
  MOTHER: 'mother',
  FATHER: 'father',
  CHILD: 'child',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PARENT_ROLES = [ROLES.MOTHER, ROLES.FATHER] as const;
export type ParentRole = (typeof PARENT_ROLES)[number];

/** US-02: a child can have their own login only from this age. */
export const MIN_CHILD_ACCOUNT_AGE = 10;

export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';

export const PASSWORD_MIN_LENGTH = 8;

/** US-04: an invitation to link the other parent stays valid for this many days. */
export const INVITE_TTL_DAYS = 7;
export const MAX_PARENTS_PER_CHILD = 2;

export const INVITE_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;
export type InviteStatus = (typeof INVITE_STATUSES)[keyof typeof INVITE_STATUSES];
