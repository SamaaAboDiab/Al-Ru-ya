import { CalendarDays, Eye } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { AppHeader } from '@/components/AppHeader';
import { BackLink } from '@/components/BackLink';
import { Forbidden } from '@/components/Forbidden';
import { WeekSchedule } from '@/components/schedule/WeekSchedule';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getChild, getCurrentUser, getLocale, getSchedule } from '@/lib/server';

/** US-06: parents see the child's schedule, read-only. */
export default async function ChildSchedulePage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} user={user} homeHref={homeFor(user.role)} />;

  // The API returns nothing for a child this parent isn't linked to.
  const [child, items] = await Promise.all([getChild(childId), getSchedule(childId)]);
  if (!child) notFound();

  const t = dictionaries[locale];
  const s = t.schedule;
  const list = items ?? [];

  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page">
        <BackLink href="/parent" label={s.back} />
        <div className="page-head">
          <div>
            <h1 className="page-title">
              <bdi>{s.childTitle(child.name)}</bdi>
            </h1>
            <p className="page-subtitle">{s.childSubtitle(child.name)}</p>
          </div>
          <span className="chip chip-info">
            <Eye size={14} aria-hidden />
            {s.readOnly}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <CalendarDays size={28} aria-hidden />
            </span>
            <h2 className="section-title" style={{ margin: 0 }}>
              {s.emptyParentTitle}
            </h2>
            <p>{child.hasAccount ? s.emptyParentBody(child.name) : s.noAccountBody(child.name)}</p>
          </div>
        ) : (
          <WeekSchedule locale={locale} childId={childId} items={list} editable={false} />
        )}
      </main>
    </>
  );
}
