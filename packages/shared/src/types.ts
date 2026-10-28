import type { InviteStatus, Locale, ParentRole, Role, ScheduleDay } from './constants';
import type { ErrorCode } from './errors';

export interface ParentSummary {
  id: string;
  name: string;
  role: ParentRole;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  locale: Locale;
  /** Set only for child accounts: the child profile this login belongs to. */
  childId?: string;
}

export interface ChildDTO {
  id: string;
  name: string;
  birthDate: string;
  hasAccount: boolean;
  parents: ParentSummary[];
}

/** What the inviting parent sees. `inviteUrl` is only returned right after creating it. */
export interface InvitationDTO {
  id: string;
  email: string;
  status: InviteStatus;
  expiresAt: string;
  inviteUrl?: string;
}

export interface ScheduleItemDTO {
  id: string;
  activity: string;
  day: ScheduleDay;
  startTime: string;
  endTime: string;
  location?: string;
  updatedAt: string;
}

/** What the invited person sees when opening the link. */
export interface InvitationPreviewDTO {
  childName: string;
  inviterName: string;
  email: string;
  status: InviteStatus;
  expiresAt: string;
}

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: ErrorCode; message: string; fields?: Record<string, string> };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
