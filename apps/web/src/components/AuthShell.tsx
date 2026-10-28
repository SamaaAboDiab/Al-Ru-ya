import { CalendarDays, HeartHandshake, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoMark } from './Logo';

const POINT_ICONS = [CalendarDays, HeartHandshake, ShieldCheck];

/** Sign-in, sign-up and invitation pages: brand panel beside the form on desktop, a slim header on phones. */
export function AuthShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = dictionaries[locale];
  return (
    <div className="auth">
      <aside className="auth-brand">
        <div className="brand">
          <LogoMark size={52} />
          <span className="brand-text">
            <span className="brand-name">{t.appName}</span>
            <span className="brand-sub">{t.appSubtitle}</span>
          </span>
        </div>
        <div className="auth-lang-mobile">
          <LanguageSwitcher locale={locale} variant="on-dark" />
        </div>
        <div className="auth-brand-copy">
          <h2>{t.authBrand.title}</h2>
          <p>{t.authBrand.body}</p>
        </div>
        <ul className="auth-points">
          {t.authBrand.points.map((point, i) => {
            const Icon = POINT_ICONS[i];
            return (
              <li key={point}>
                <span className="auth-point-icon">
                  <Icon size={20} aria-hidden />
                </span>
                {point}
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-toolbar">
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="auth-form">{children}</div>
      </main>
    </div>
  );
}
