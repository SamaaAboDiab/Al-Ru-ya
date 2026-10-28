import { cookies } from 'next/headers';
import { cache } from 'react';
import type {
  ApiResponse,
  ChildDTO,
  ConversationSummaryDTO,
  DailyLogDTO,
  InvitationDTO,
  InvitationPreviewDTO,
  MessageDTO,
  NotificationListDTO,
  ScheduleItemDTO,
  UserDTO,
  VisitDTO,
} from '@ruya/shared';
import { LOCALE_COOKIE, dictionaries, resolveLocale } from './i18n';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function getLocale() {
  return resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}

/**
 * Calls the API from a server component, forwarding the visitor's session cookie.
 * Wrapped in React `cache`, so the layout and the page asking for the same path
 * (the current user, notifications) share one request per render.
 */
const cachedGet = cache(async (path: string): Promise<unknown> => {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API_URL}${path}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const body = (await res.json()) as ApiResponse<unknown>;
  return body.success ? body.data : null;
});

function serverGet<T>(path: string): Promise<T | null> {
  return cachedGet(path) as Promise<T | null>;
}

export const getCurrentUser = () => serverGet<UserDTO>('/api/auth/me');
export const getMyChildren = () => serverGet<ChildDTO[]>('/api/children');
export const getChild = (id: string) => serverGet<ChildDTO>(`/api/children/${encodeURIComponent(id)}`);
export const getInvitations = (childId: string) =>
  serverGet<InvitationDTO[]>(`/api/children/${encodeURIComponent(childId)}/invitations`);
export const getSchedule = (childId: string) =>
  serverGet<ScheduleItemDTO[]>(`/api/children/${encodeURIComponent(childId)}/schedule`);
export const getDailyLog = (childId: string, date: string) =>
  serverGet<DailyLogDTO>(`/api/children/${encodeURIComponent(childId)}/daily-logs/${encodeURIComponent(date)}`);
export const getVisits = (childId: string) =>
  serverGet<VisitDTO[]>(`/api/children/${encodeURIComponent(childId)}/visits`);
export const getVisit = (childId: string, visitId: string) =>
  serverGet<VisitDTO>(`/api/children/${encodeURIComponent(childId)}/visits/${encodeURIComponent(visitId)}`);
export const getConversations = (childId: string) =>
  serverGet<ConversationSummaryDTO[]>(`/api/children/${encodeURIComponent(childId)}/conversations`);
export const getMessages = (childId: string, parentId: string) =>
  serverGet<MessageDTO[]>(
    `/api/children/${encodeURIComponent(childId)}/conversations/${encodeURIComponent(parentId)}/messages`,
  );
export const getNotifications = () => serverGet<NotificationListDTO>('/api/notifications');
export const getInvitationPreview = (token: string) =>
  serverGet<InvitationPreviewDTO>(`/api/invitations/${encodeURIComponent(token)}`);
