'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Locale } from '@ruya/shared';
import { apiPost } from '@/lib/client';
import { dictionaries } from '@/lib/i18n';

type Props = { locale: Locale; redirectTo?: string; variant?: 'icon' | 'button' };

export function LogoutButton({ locale, redirectTo = '/login', variant = 'icon' }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const label = dictionaries[locale].nav.logout;

  async function logout() {
    setPending(true);
    await apiPost('/api/auth/logout');
    router.replace(redirectTo);
    router.refresh();
  }

  if (variant === 'button') {
    return (
      <button type="button" className="btn btn-secondary" onClick={logout} disabled={pending}>
        <LogOut size={18} aria-hidden className="rtl-flip" />
        {label}
      </button>
    );
  }

  return (
    <button type="button" className="icon-btn" onClick={logout} disabled={pending} aria-label={label} title={label}>
      <LogOut size={20} aria-hidden className="rtl-flip" />
    </button>
  );
}
