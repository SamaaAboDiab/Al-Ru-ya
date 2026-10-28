import { ROLES, type Role } from '@ruya/shared';

/** US-01 / US-03: the role decides which page opens after sign-in. */
export function homeFor(role: Role) {
  return role === ROLES.CHILD ? '/child' : '/parent';
}
