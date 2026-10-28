import { Bell } from 'lucide-react';
import Link from 'next/link';
import { ROLES, type Locale, type UserDTO } from '@ruya/shared';
import { dictionaries, formatNumber } from '@/lib/i18n';
import { getNotifications } from '@/lib/server';
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

/** Header for signed-in pages, with the notification bell (US-12). */
export async function AppHeader({ locale, user }: { locale: Locale; user: UserDTO }) {
  const t = dictionaries[locale];
  const unread = (await getNotifications())?.unread ?? 0;
  const bellLabel = unread > 0 ? `${t.notifications.open}: ${t.notifications.unread(unread)}` : t.notifications.open;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <BrandLink locale={locale} />
        <LanguageSwitcher locale={locale} />
        <Link href="/notifications" className="icon-btn bell" aria-label={bellLabel} title={bellLabel}>
          <Bell size={20} aria-hidden />
          {unread > 0 && (
            <span className="bell-badge" aria-hidden>
              {unread > 9 ? '+9' : formatNumber(unread, locale)}
            </span>
          )}
        </Link>
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
