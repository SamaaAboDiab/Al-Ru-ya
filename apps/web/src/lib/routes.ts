import { ROLES, type Role } from '@ruya/shared';

/** US-01 / US-03: the role decides which page opens after sign-in. */
export function homeFor(role: Role) {
  return role === ROLES.CHILD ? '/child' : '/parent';
}

/** Only same-site paths are allowed as a post-login destination, never another origin. */
export function safeNext(value: string | string[] | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined;
  return value;
}
