import { notFound, redirect } from 'next/navigation';
import { ROLES, VISIT_STATUSES } from '@ruya/shared';
import { Forbidden } from '@/components/Forbidden';
import { EditVisitDialog } from '@/components/visits/VisitDialogs';
import { VisitDetail } from '@/components/visits/VisitDetail';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getChild, getCurrentUser, getLocale, getVisit } from '@/lib/server';

export default async function MyVisitPage({ params }: { params: Promise<{ visitId: string }> }) {
  const { visitId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role !== ROLES.CHILD || !user.childId) {
    return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;
  }

  const [child, visit] = await Promise.all([getChild(user.childId), getVisit(user.childId, visitId)]);
  if (!visit) notFound();
  const t = dictionaries[locale];
  const open = visit.status === VISIT_STATUSES.UPCOMING || visit.status === VISIT_STATUSES.PENDING;

  return (
    <main className="page page-narrow">
      <VisitDetail
        locale={locale}
        visit={visit}
        back={{ href: '/child/visits', label: t.visits.myTitle }}
        actions={
          visit.canEdit ? (
            <EditVisitDialog locale={locale} childId={user.childId} parents={child?.parents ?? []} visit={visit} />
          ) : (
            open && <p className="muted field-hint">{t.visits.editLocked}</p>
          )
        }
      />
    </main>
  );
}
