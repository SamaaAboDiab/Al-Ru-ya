'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Locale } from '@ruya/shared';
import { LOCALE_COOKIE, dictionaries } from '@/lib/i18n';

/** Explicit language picker for the settings page; the header icon stays as the quick toggle. */
export function LanguageChoice({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].account;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <fieldset className="choice-group" disabled={pending}>
      <legend className="field-label">{t.language}</legend>
      <div className="choice-options">
        {(['ar', 'en'] as const).map((value) => (
          <label key={value} className="choice" lang={value}>
            <input
              type="radio"
              name="language"
              value={value}
              checked={locale === value}
              onChange={() => choose(value)}
            />
            <span className="choice-icon display">{value === 'ar' ? 'ع' : 'En'}</span>
            {value === 'ar' ? t.arabic : t.english}
          </label>
        ))}
      </div>
      <span className="field-hint">{t.languageHint}</span>
    </fieldset>
  );
}
