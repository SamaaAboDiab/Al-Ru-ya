'use client';

import { Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Locale } from '@ruya/shared';
import { LOCALE_COOKIE, dictionaries } from '@/lib/i18n';

/** Icon button that flips between Arabic and English. */
export function LanguageSwitcher({ locale, variant }: { locale: Locale; variant?: 'on-dark' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === 'ar' ? 'en' : 'ar';
  const label = dictionaries[locale].switchLanguageLabel;

  function switchLanguage() {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      className={variant === 'on-dark' ? 'icon-btn icon-btn-dark' : 'icon-btn'}
      onClick={switchLanguage}
      disabled={pending}
      aria-label={label}
      title={label}
      lang={next}
    >
      <Languages size={20} aria-hidden />
    </button>
  );
}
