import Link from 'next/link';
import type { Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoutButton } from './LogoutButton';

export function TopBar({ locale, signedIn }: { locale: Locale; signedIn: boolean }) {
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        {dictionaries[locale].appName}
      </Link>
      <div className="topbar-actions">
        <LanguageSwitcher locale={locale} />
        {signedIn && <LogoutButton locale={locale} />}
      </div>
    </header>
  );
}
