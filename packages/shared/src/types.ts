import type {
  CancelReason,
  DailyItem,
  InviteStatus,
  Locale,
  NotificationType,
  ParentRole,
  Role,
  ScheduleDay,
  VisitAction,
  VisitStatus,
} from './constants';
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

/** US-07/08: one child's checklist for one date. */
export interface DailyLogDTO {
  date: string;
  today: string;
  /** Each checked item with the moment it was checked. */
  entries: { item: DailyItem; doneAt: string }[];
  updatedAt: string | null;
  /** True only for the child's own log, on the same day. */
  editable: boolean;
}

export interface VisitHistoryEntry {
  action: VisitAction;
  at: string;
  byName: string;
  byRole: Role;
}

/** US-09..13. `can*` flags are computed for the user who asked. */
export interface VisitDTO {
  id: string;
  childId: string;
  parent: ParentSummary;
  date: string;
  startTime: string;
  endTime?: string;
  status: VisitStatus;
  cancelReason?: { code?: CancelReason; note?: string };
  history: VisitHistoryEntry[];
  canEdit: boolean;
  canConfirm: boolean;
  canCancel: boolean;
}

/** US-12 */
export interface NotificationDTO {
  id: string;
  type: NotificationType;
  childId: string;
  childName: string;
  visitId: string;
  actorName: string;
  actorRole: Role;
  visitDate: string;
  visitTime: string;
  reason?: { code?: CancelReason; note?: string };
  createdAt: string;
  read: boolean;
}

export interface NotificationListDTO {
  items: NotificationDTO[];
  unread: number;
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
