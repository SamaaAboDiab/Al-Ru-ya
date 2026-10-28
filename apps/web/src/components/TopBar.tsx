import Link from 'next/link';
import type { Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoMark } from './Logo';
import { LogoutButton } from './LogoutButton';

export function TopBar({ locale, signedIn }: { locale: Locale; signedIn: boolean }) {
  const t = dictionaries[locale];
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <LogoMark size={44} />
        <span className="brand-text">
          <span className="brand-name">{t.appName}</span>
          <span className="brand-sub">{t.appSubtitle}</span>
        </span>
      </Link>
      <div className="topbar-actions">
        <LanguageSwitcher locale={locale} />
        {signedIn && <LogoutButton locale={locale} />}
      </div>
    </header>
  );
}
