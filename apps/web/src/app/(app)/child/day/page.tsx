import { Lock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { ROLES, isIsoDate, todayIn } from '@ruya/shared';
import { BackButton } from '@/components/BackButton';
import { DailyChecklist } from '@/components/daily/DailyChecklist';
import { DayNav } from '@/components/daily/DayNav';
import { Forbidden } from '@/components/Forbidden';
import { FormAlert } from '@/components/FormAlert';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getDailyLog, getLocale } from '@/lib/server';

type SearchParams = Promise<{ date?: string | string[] }>;

/** US-07: the child checks off today; earlier days are shown locked. */
export default async function MyDayPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role !== ROLES.CHILD || !user.childId) {
    return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;
  }

  const today = todayIn();
  const requested = (await searchParams).date;
  const date = typeof requested === 'string' && isIsoDate(requested) && requested <= today ? requested : today;
  const log = await getDailyLog(user.childId, date);
  const t = dictionaries[locale];

  return (
    <>
      <main className="page page-narrow">
        <div className="page-head">
          <BackButton href="/child" label={t.nav.home} />
          <div>
            <h1 className="page-title">{t.day.myTitle}</h1>
            <p className="page-subtitle">{t.day.mySubtitle}</p>
          </div>
        </div>

        <section className="card stack">
          <DayNav locale={locale} basePath="/child/day" date={date} today={log?.today ?? today} />
          {log && !log.editable && (
            <FormAlert tone="warning">
              <span className="inline-icon">
                <Lock size={14} aria-hidden /> {t.day.locked}
              </span>
            </FormAlert>
          )}
          {log ? (
            <DailyChecklist key={date} locale={locale} childId={user.childId} log={log} />
          ) : (
            <FormAlert>{t.errors.INTERNAL}</FormAlert>
          )}
        </section>
      </main>
    </>
  );
}
