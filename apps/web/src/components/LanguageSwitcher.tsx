'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Locale } from '@ruya/shared';
import { LOCALE_COOKIE, dictionaries } from '@/lib/i18n';

export function LanguageSwitcher({ locale, variant }: { locale: Locale; variant?: 'on-dark' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === 'ar' ? 'en' : 'ar';

  function switchLanguage() {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      className={variant === 'on-dark' ? 'btn btn-ghost-dark' : 'btn btn-ghost'}
      onClick={switchLanguage} disabled={pending} lang={next}>
      {dictionaries[locale].switchLanguage}
    </button>
  );
}
