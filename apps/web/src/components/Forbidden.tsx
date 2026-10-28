import Link from 'next/link';
import type { Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';
import { TopBar } from './TopBar';

/** US-03: shown when a signed-in user opens a page meant for another role. */
export function Forbidden({ locale, homeHref }: { locale: Locale; homeHref: string }) {
  const t = dictionaries[locale].forbidden;
  return (
    <main className="page">
      <TopBar locale={locale} signedIn />
      <div className="card stack" role="alert">
        <h1>{t.title}</h1>
        <p className="muted">{t.body}</p>
        <Link href={homeHref} className="btn btn-primary" style={{ alignSelf: 'start', textDecoration: 'none' }}>
          {t.back}
        </Link>
      </div>
    </main>
  );
}
