'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Locale } from '@ruya/shared';
import { apiPost } from '@/lib/client';
import { dictionaries } from '@/lib/i18n';

type Props = { locale: Locale; redirectTo?: string; variant?: 'button' | 'row' };

/** Sign-out lives on the account screen (as a menu row) and on the invitation page (as a button). */
export function LogoutButton({ locale, redirectTo = '/login', variant = 'button' }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const label = dictionaries[locale].nav.logout;

  async function logout() {
    setPending(true);
    await apiPost('/api/auth/logout');
    router.replace(redirectTo);
    router.refresh();
  }

  // A row in the account menu, styled like the links around it.
  if (variant === 'row') {
    return (
      <button type="button" className="menu-row menu-row-danger" onClick={logout} disabled={pending}>
        <span className="menu-icon">
          {pending ? <span className="spinner" aria-hidden /> : <LogOut size={20} aria-hidden className="rtl-flip" />}
        </span>
        <span className="menu-label">{label}</span>
      </button>
    );
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={logout} disabled={pending}>
      <LogOut size={18} aria-hidden className="rtl-flip" />
      {label}
    </button>
  );
}
