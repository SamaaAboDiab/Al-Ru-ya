import type { Locale, Role } from './constants';
import type { ErrorCode } from './errors';

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
}

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: ErrorCode; message: string; fields?: Record<string, string> };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
