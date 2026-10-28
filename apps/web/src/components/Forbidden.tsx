import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';

/** US-03: shown when a signed-in user opens a page meant for another role. The layout supplies the header. */
export function Forbidden({ locale, homeHref }: { locale: Locale; homeHref: string }) {
  const t = dictionaries[locale].forbidden;
  return (
    <main className="page">
      <div className="empty-state" role="alert">
        <span className="status-icon status-icon-danger">
          <ShieldAlert size={28} aria-hidden />
        </span>
        <h1 className="page-title">{t.title}</h1>
        <p>{t.body}</p>
        <Link href={homeHref} className="btn btn-primary">
          {t.back}
        </Link>
      </div>
    </main>
  );
}
