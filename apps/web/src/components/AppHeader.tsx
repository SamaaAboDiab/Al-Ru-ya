import { Bell } from 'lucide-react';
import Link from 'next/link';
import { ROLES, type Locale, type UserDTO } from '@ruya/shared';
import { dictionaries, formatNumber } from '@/lib/i18n';
import { getNotifications } from '@/lib/server';
import { Avatar } from './Avatar';
import { ChildNav } from './ChildNav';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoMark } from './Logo';

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

  const isChild = user.role === ROLES.CHILD;

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <BrandLink locale={locale} />
          {isChild && <ChildNav locale={locale} variant="inline" />}
          <LanguageSwitcher locale={locale} />
          <Link href="/notifications" className="icon-btn bell" aria-label={bellLabel} title={bellLabel}>
            <Bell size={20} aria-hidden />
            {unread > 0 && (
              <span className="bell-badge" aria-hidden>
                {unread > 9 ? '+9' : formatNumber(unread, locale)}
              </span>
            )}
          </Link>
          <Link href="/account" className="user-chip" aria-label={t.account.open} title={t.account.open}>
            <Avatar name={user.name} id={user.id} />
            <span className="user-chip-name">
              <bdi>{user.name}</bdi>
              <small>{user.role === ROLES.CHILD ? t.nav.child : t.nav.parent}</small>
            </span>
          </Link>
        </div>
      </header>
      {isChild && <ChildNav locale={locale} variant="bar" />}
    </>
  );
}
