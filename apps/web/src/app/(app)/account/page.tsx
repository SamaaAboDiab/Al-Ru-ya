import {
  Bell,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  House,
  MessageCircle,
  Settings,
  Users,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { MenuList, type MenuItem } from '@/components/account/MenuList';
import { ProfilePhoto } from '@/components/account/ProfilePhoto';
import { BackButton } from '@/components/BackButton';
import { LogoMark } from '@/components/Logo';
import { LogoutButton } from '@/components/LogoutButton';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getConversations, getCurrentUser, getLocale, getNotifications } from '@/lib/server';

/** The account screen from the design: who you are, where to go, and sign-out. */
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  const t = dictionaries[locale];
  const isChild = user.role === ROLES.CHILD;

  const [notifications, conversations] = await Promise.all([
    getNotifications(),
    isChild && user.childId ? getConversations(user.childId) : Promise.resolve(null),
  ]);
  const unreadMessages = (conversations ?? []).reduce((sum, c) => sum + c.unread, 0);

  const sections: MenuItem[] = isChild
    ? [
        { href: '/child/schedule', label: t.schedule.myTitle, Icon: CalendarDays },
        { href: '/child/day', label: t.day.myTitle, Icon: ClipboardCheck },
        { href: '/child/visits', label: t.visits.myTitle, Icon: House },
        { href: '/child/messages', label: t.messages.myTitle, Icon: MessageCircle, badge: unreadMessages },
      ]
    : [{ href: '/parent', label: t.nav.myChildren, Icon: Users }];

  const general: MenuItem[] = [
    { href: '/notifications', label: t.notifications.title, Icon: Bell, badge: notifications?.unread ?? 0 },
    { href: '/account/settings', label: t.account.settings, Icon: Settings },
    { href: '/account/help', label: t.account.help, Icon: CircleHelp },
  ];

  return (
    <>
      <main className="page page-narrow account">
        <div className="page-head">
          <BackButton href={homeFor(user.role)} label={t.nav.home} />
          <div>
            <h1 className="page-title">{t.account.title}</h1>
          </div>
        </div>
        <ProfilePhoto locale={locale} user={user} isChild={isChild}>
          <h2 className="profile-name">
            <bdi>{user.name}</bdi>
          </h2>
          <p className="profile-role">{isChild ? t.nav.child : t.fields[user.role as 'mother' | 'father']}</p>
          <p className="profile-email ltr">{user.email}</p>
        </ProfilePhoto>

        <MenuList locale={locale} items={sections} />
        <MenuList locale={locale} items={general}>
          <li>
            <LogoutButton locale={locale} variant="row" />
          </li>
        </MenuList>

        <footer className="account-footer">
          <LogoMark size={64} />
          <strong className="account-footer-name">{t.appName}</strong>
          <span>{t.appSubtitle}</span>
          <p>{t.account.footer}</p>
        </footer>
      </main>
    </>
  );
}
