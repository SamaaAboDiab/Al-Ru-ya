import { CalendarDays } from 'lucide-react';
import { redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { AppHeader } from '@/components/AppHeader';
import { Forbidden } from '@/components/Forbidden';
import { AddScheduleItem } from '@/components/schedule/AddScheduleItem';
import { WeekSchedule } from '@/components/schedule/WeekSchedule';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getLocale, getSchedule } from '@/lib/server';

/** US-06: the child builds and edits their own weekly schedule. */
export default async function MySchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role !== ROLES.CHILD || !user.childId) {
    return <Forbidden locale={locale} user={user} homeHref={homeFor(user.role)} />;
  }

  const t = dictionaries[locale];
  const items = (await getSchedule(user.childId)) ?? [];

  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">{t.schedule.myTitle}</h1>
            <p className="page-subtitle">{t.schedule.mySubtitle}</p>
          </div>
          {items.length > 0 && <AddScheduleItem locale={locale} childId={user.childId} />}
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <CalendarDays size={28} aria-hidden />
            </span>
            <h2 className="section-title" style={{ margin: 0 }}>
              {t.schedule.emptyMineTitle}
            </h2>
            <p>{t.schedule.emptyMineBody}</p>
            <AddScheduleItem locale={locale} childId={user.childId} />
          </div>
        ) : (
          <WeekSchedule locale={locale} childId={user.childId} items={items} editable />
        )}
      </main>
    </>
  );
}
