import { ClipboardCheck, Eye } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { ROLES, isIsoDate, todayIn } from '@ruya/shared';
import { AppHeader } from '@/components/AppHeader';
import { ChildContext } from '@/components/ChildContext';
import { DailyChecklist } from '@/components/daily/DailyChecklist';
import { DayNav } from '@/components/daily/DayNav';
import { Forbidden } from '@/components/Forbidden';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getChild, getCurrentUser, getDailyLog, getLocale } from '@/lib/server';

type Props = {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
};

/** US-08: both linked parents see the same daily log, by date, read-only. */
export default async function ChildDayPage({ params, searchParams }: Props) {
  const { childId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} user={user} homeHref={homeFor(user.role)} />;

  const today = todayIn();
  const requested = (await searchParams).date;
  const date = typeof requested === 'string' && isIsoDate(requested) && requested <= today ? requested : today;

  // The API returns nothing for a child this parent isn't linked to.
  const [child, log] = await Promise.all([getChild(childId), getDailyLog(childId, date)]);
  if (!child || !log) notFound();

  const t = dictionaries[locale];
  const basePath = `/parent/children/${childId}/day`;

  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page">
        <ChildContext locale={locale} child={child} active="day" />
        <div className="content-narrow">
          <div className="section-bar">
            <p className="section-note">{t.day.childSubtitle}</p>
            <span className="chip chip-info">
              <Eye size={14} aria-hidden />
              {t.schedule.readOnly}
            </span>
          </div>

          {child.hasAccount ? (
            <section className="card stack">
              <DayNav locale={locale} basePath={basePath} date={date} today={log.today} />
              <DailyChecklist key={date} locale={locale} childId={childId} log={log} />
            </section>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <ClipboardCheck size={28} aria-hidden />
              </span>
              <p>{t.day.noAccountBody(child.name)}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
