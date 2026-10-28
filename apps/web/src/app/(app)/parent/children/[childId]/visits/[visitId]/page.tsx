import { notFound, redirect } from 'next/navigation';
import { ROLES, VISIT_STATUSES } from '@ruya/shared';
import { ChildContext } from '@/components/ChildContext';
import { Forbidden } from '@/components/Forbidden';
import { CantVisitDialog, ConfirmVisitButton } from '@/components/visits/ParentVisitActions';
import { VisitDetail } from '@/components/visits/VisitDetail';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getChild, getCurrentUser, getLocale, getVisit } from '@/lib/server';

type Props = { params: Promise<{ childId: string; visitId: string }> };

/** US-10/11: the visit's parent confirms or cancels here; the other parent sees the same, read-only. */
export default async function ParentVisitPage({ params }: Props) {
  const { childId, visitId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;

  const [child, visit] = await Promise.all([getChild(childId), getVisit(childId, visitId)]);
  if (!child || !visit) notFound();

  const t = dictionaries[locale];
  const open = visit.status === VISIT_STATUSES.UPCOMING || visit.status === VISIT_STATUSES.PENDING;
  const isMine = visit.parent.id === user.id;

  return (
    <main className="page child-page">
      <ChildContext locale={locale} child={child} active="visits" />
      <div className="content-narrow">
        <VisitDetail
          locale={locale}
          visit={visit}
          back={{ href: `/parent/children/${childId}/visits`, label: t.visits.open }}
          actions={
            open && (
              <div className="stack">
                {visit.canConfirm && <ConfirmVisitButton locale={locale} childId={childId} visitId={visit.id} />}
                {isMine && visit.status === VISIT_STATUSES.UPCOMING && (
                  <p className="muted field-hint">{t.visits.notStarted}</p>
                )}
                {visit.canCancel && <CantVisitDialog locale={locale} childId={childId} visitId={visit.id} variant="block" />}
                {!isMine && <p className="muted field-hint">{t.visits.notYours(visit.parent.name)}</p>}
              </div>
            )
          }
        />
      </div>
    </main>
  );
}
