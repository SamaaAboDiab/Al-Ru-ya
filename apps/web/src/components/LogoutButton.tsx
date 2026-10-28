'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Locale } from '@ruya/shared';
import { apiPost } from '@/lib/client';
import { dictionaries } from '@/lib/i18n';

export function LogoutButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await apiPost('/api/auth/logout');
    router.replace('/login');
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={logout} disabled={pending}>
      {dictionaries[locale].nav.logout}
    </button>
  );
}
