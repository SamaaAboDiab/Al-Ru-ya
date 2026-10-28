import { redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { BackButton } from '@/components/BackButton';
import { NotificationList } from '@/components/notifications/NotificationList';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getLocale, getNotifications } from '@/lib/server';

/** US-12: in-app notifications for visit logged, confirmed and "can't visit". */
export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  const t = dictionaries[locale];
  const list = await getNotifications();

  return (
    <>
      <main className="page page-narrow">
        <div className="page-head">
          <BackButton href={homeFor(user.role)} label={t.schedule.back} />
          <div>
            <h1 className="page-title">{t.notifications.title}</h1>
            <p className="page-subtitle">{t.notifications.subtitle}</p>
          </div>
        </div>
        <NotificationList locale={locale} items={list?.items ?? []} isChild={user.role === ROLES.CHILD} />
      </main>
    </>
  );
}
