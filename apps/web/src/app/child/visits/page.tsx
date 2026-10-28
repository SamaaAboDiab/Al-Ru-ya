import { House } from 'lucide-react';
import { redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { AppHeader } from '@/components/AppHeader';
import { BackLink } from '@/components/BackLink';
import { Forbidden } from '@/components/Forbidden';
import { LogVisitDialog } from '@/components/visits/VisitDialogs';
import { VisitList } from '@/components/visits/VisitList';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getChild, getCurrentUser, getLocale, getVisits } from '@/lib/server';

/** US-09/13: the child logs visits and follows their confirmation. */
export default async function MyVisitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role !== ROLES.CHILD || !user.childId) {
    return <Forbidden locale={locale} user={user} homeHref={homeFor(user.role)} />;
  }

  const [child, visits] = await Promise.all([getChild(user.childId), getVisits(user.childId)]);
  const t = dictionaries[locale];
  const list = visits ?? [];
  const parents = child?.parents ?? [];

  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page page-narrow">
        <BackLink href="/child" label={t.schedule.back} />
        <div className="page-head">
          <div>
            <h1 className="page-title">{t.visits.myTitle}</h1>
            <p className="page-subtitle">{t.visits.mySubtitle}</p>
          </div>
          {list.length > 0 && <LogVisitDialog locale={locale} childId={user.childId} parents={parents} />}
        </div>

        {list.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <House size={28} aria-hidden />
            </span>
            <h2 className="section-title" style={{ margin: 0 }}>
              {t.visits.emptyTitle}
            </h2>
            <p>{t.visits.emptyMine}</p>
            <LogVisitDialog locale={locale} childId={user.childId} parents={parents} />
          </div>
        ) : (
          <VisitList locale={locale} visits={list} basePath="/child/visits" />
        )}
      </main>
    </>
  );
}
