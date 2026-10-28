import { House } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ROLES, VISIT_STATUSES, type VisitStatus } from '@ruya/shared';
import { ChildContext } from '@/components/ChildContext';
import { Forbidden } from '@/components/Forbidden';
import { CantVisitDialog } from '@/components/visits/ParentVisitActions';
import { VisitList } from '@/components/visits/VisitList';
import { dictionaries, formatNumber } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getChild, getCurrentUser, getLocale, getVisits } from '@/lib/server';

const FILTERS = Object.values(VISIT_STATUSES);

type Props = {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
};

/** US-13: every visit with its status; US-11 starts here too. */
export default async function ChildVisitsPage({ params, searchParams }: Props) {
  const { childId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;

  const [child, visits] = await Promise.all([getChild(childId), getVisits(childId)]);
  if (!child || !visits) notFound();

  const requested = (await searchParams).status;
  const status = FILTERS.includes(requested as VisitStatus) ? (requested as VisitStatus) : null;
  const shown = status ? visits.filter((v) => v.status === status) : visits;
  const count = (s: VisitStatus | null) => (s ? visits.filter((v) => v.status === s).length : visits.length);

  const t = dictionaries[locale];
  const basePath = `/parent/children/${childId}/visits`;

  return (
    <>
      <main className="page child-page">
        <ChildContext locale={locale} child={child} active="visits" />
        <div className="content-narrow">
          <div className="section-bar">
            <p className="section-note">{t.visits.childSubtitle}</p>
            <CantVisitDialog locale={locale} childId={childId} />
          </div>

          {visits.length > 0 && (
            <nav className="filter-tabs" aria-label={t.visits.open}>
              {[null, ...FILTERS].map((s) => (
                <Link
                  key={s ?? 'all'}
                  href={s ? `${basePath}?status=${s}` : basePath}
                  className="filter-tab"
                  aria-current={s === status ? 'page' : undefined}
                >
                  {s ? t.visits.statuses[s] : t.visits.filterAll}
                  <span className="filter-count">{formatNumber(count(s), locale)}</span>
                </Link>
              ))}
            </nav>
          )}

          {shown.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <House size={28} aria-hidden />
              </span>
              <h2 className="section-title" style={{ margin: 0 }}>
                {t.visits.emptyTitle}
              </h2>
              <p>
                {visits.length > 0
                  ? t.visits.emptyFiltered
                  : child.hasAccount
                    ? t.visits.emptyParent
                    : t.visits.noAccountBody(child.name)}
              </p>
            </div>
          ) : (
            <VisitList locale={locale} visits={shown} basePath={basePath} />
          )}
        </div>
      </main>
    </>
  );
}
