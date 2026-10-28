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

/** US-06: days in week order. The week starts on Saturday, as in Egypt. */
export const SCHEDULE_DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;
export type ScheduleDay = (typeof SCHEDULE_DAYS)[number];
export const MAX_SCHEDULE_ITEMS = 100;

/**
 * US-07: what a child can check off for the day, grouped by area, in display order.
 * Keys are stored in logs, so existing keys must never be renamed or removed.
 */
export const DAILY_CATEGORIES = {
  meals: ['breakfast', 'lunch', 'dinner', 'snack'],
  health: ['medicine', 'doctor', 'therapy', 'water', 'sleep'],
  worship: ['prayer', 'quran', 'adhkar'],
  education: ['school', 'lesson', 'online_class', 'homework', 'study', 'exam_prep', 'reading'],
  skills: ['language', 'coding', 'art', 'music'],
  club: ['training', 'club', 'course'],
} as const;
export type DailyCategory = keyof typeof DAILY_CATEGORIES;
export type DailyItem = (typeof DAILY_CATEGORIES)[DailyCategory][number];
export const DAILY_ITEMS = Object.values(DAILY_CATEGORIES).flat() as DailyItem[];

/**
 * "Today" for daily logs and same-day edits. The MVP serves families in Egypt;
 * move this to the family's profile when other countries are added.
 */
export const FAMILY_TIMEZONE = 'Africa/Cairo';

/** US-13: a visit's status is derived from its data, never stored. */
export const VISIT_STATUSES = {
  UPCOMING: 'upcoming',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;
export type VisitStatus = (typeof VISIT_STATUSES)[keyof typeof VISIT_STATUSES];

/** US-11: reasons a parent can pick for "I can't visit". "other" needs a note. */
export const CANCEL_REASONS = ['sick', 'work', 'travel', 'emergency', 'other'] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];
export const CANCEL_NOTE_MAX = 200;

/** US-13: every change to a visit is kept with its time and author. */
export const VISIT_ACTIONS = ['created', 'edited', 'confirmed', 'cancelled'] as const;
export type VisitAction = (typeof VISIT_ACTIONS)[number];

/** US-12: in-app notifications about visits. */
export const NOTIFICATION_TYPES = {
  VISIT_LOGGED: 'visit_logged',
  VISIT_CONFIRMED: 'visit_confirmed',
  VISIT_CANCELLED: 'visit_cancelled',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Profile photos are resized in the browser to a small square before upload, so this is generous. */
export const PROFILE_PHOTO_MAX_BYTES = 300 * 1024;
export const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ProfilePhotoType = (typeof PROFILE_PHOTO_TYPES)[number];

/** US-14: one conversation per child-parent pair. */
export const MESSAGE_MAX_LENGTH = 1000;
export const MESSAGES_PAGE_SIZE = 50;
