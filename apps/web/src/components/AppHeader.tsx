import Link from 'next/link';
import { ROLES, type Locale, type UserDTO } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';
import { Avatar } from './Avatar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoMark } from './Logo';
import { LogoutButton } from './LogoutButton';

export function BrandLink({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  return (
    <Link href="/" className="brand">
      <LogoMark size={44} />
      <span className="brand-text">
        <span className="brand-name">{t.appName}</span>
        <span className="brand-sub">{t.appSubtitle}</span>
      </span>
    </Link>
  );
}

/** Header for signed-in pages. */
export function AppHeader({ locale, user }: { locale: Locale; user: UserDTO }) {
  const t = dictionaries[locale];
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <BrandLink locale={locale} />
        <LanguageSwitcher locale={locale} />
        <div className="user-chip">
          <Avatar name={user.name} id={user.id} />
          <span className="user-chip-name">
            <bdi>{user.name}</bdi>
            <small>{user.role === ROLES.CHILD ? t.nav.child : t.nav.parent}</small>
          </span>
        </div>
        <LogoutButton locale={locale} />
      </div>
    </header>
  );
}
