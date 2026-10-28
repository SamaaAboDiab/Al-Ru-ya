'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import type { Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';

/** How long the splash loading runs before the sign-in / sign-up buttons appear. */
const SPLASH_MS = 2500;
const SEEN_KEY = 'ruya_splash_seen';

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/** Shows a loading bar on first open in this tab, then the account buttons. */
export function WelcomeActions({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].welcome;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (alreadySeen()) {
      setReady(true);
      return;
    }
    const timer = setTimeout(() => {
      setReady(true);
      try {
        sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        // Storage blocked: the splash simply plays again next time.
      }
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <div className="welcome-actions">
        <div
          className="splash-progress"
          role="progressbar"
          aria-label={t.loading}
          style={{ '--splash-ms': `${SPLASH_MS}ms` } as CSSProperties}
        >
          <span />
        </div>
        <p className="splash-label">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="welcome-actions welcome-actions-in">
      <Link href="/register" className="btn btn-on-dark">
        {t.createAccount}
      </Link>
      <Link href="/login" className="btn btn-outline-dark">
        {t.signIn}
      </Link>
    </div>
  );
}
