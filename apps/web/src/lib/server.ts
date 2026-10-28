import { cookies } from 'next/headers';
import type {
  ApiResponse,
  ChildDTO,
  InvitationDTO,
  InvitationPreviewDTO,
  ScheduleItemDTO,
  UserDTO,
} from '@ruya/shared';
import { LOCALE_COOKIE, dictionaries, resolveLocale } from './i18n';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function getLocale() {
  return resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}

/** Calls the API from a server component, forwarding the visitor's session cookie. */
async function serverGet<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API_URL}${path}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const body = (await res.json()) as ApiResponse<T>;
  return body.success ? body.data : null;
}

export const getCurrentUser = () => serverGet<UserDTO>('/api/auth/me');
export const getMyChildren = () => serverGet<ChildDTO[]>('/api/children');
export const getChild = (id: string) => serverGet<ChildDTO>(`/api/children/${encodeURIComponent(id)}`);
export const getInvitations = (childId: string) =>
  serverGet<InvitationDTO[]>(`/api/children/${encodeURIComponent(childId)}/invitations`);
export const getSchedule = (childId: string) =>
  serverGet<ScheduleItemDTO[]>(`/api/children/${encodeURIComponent(childId)}/schedule`);
export const getInvitationPreview = (token: string) =>
  serverGet<InvitationPreviewDTO>(`/api/invitations/${encodeURIComponent(token)}`);
