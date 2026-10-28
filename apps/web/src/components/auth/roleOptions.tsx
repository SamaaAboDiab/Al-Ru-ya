import { User, UserRound } from 'lucide-react';
import { PARENT_ROLES, ROLES } from '@ruya/shared';
import type { Dictionary } from '@/lib/i18n';

/** Mother / father, as choice cards with an icon. Used when a parent creates an account. */
export function roleOptions(t: Dictionary) {
  return PARENT_ROLES.map((role) => {
    const Icon = role === ROLES.MOTHER ? UserRound : User;
    return {
      value: role,
      label: t.fields[role],
      media: (
        <span className="choice-icon">
          <Icon size={18} aria-hidden />
        </span>
      ),
    };
  });
}
