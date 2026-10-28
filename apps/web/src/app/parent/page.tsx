import { CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Clock, House, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  INVITE_STATUSES,
  MAX_PARENTS_PER_CHILD,
  MIN_CHILD_ACCOUNT_AGE,
  ROLES,
  ageInYears,
  type ChildDTO,
  type InvitationDTO,
  type Locale,
} from '@ruya/shared';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Forbidden } from '@/components/Forbidden';
import { dictionaries, formatDate } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getInvitations, getLocale, getMyChildren } from '@/lib/server';
import { AddChildDialog } from './AddChildDialog';
import { ChildActions } from './ChildActions';

export default async function ParentPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} user={user} homeHref={homeFor(user.role)} />;

  const t = dictionaries[locale];
  const children = (await getMyChildren()) ?? [];
  // Only children still missing a parent need their invitations.
  const pendingInvites = new Map(
    await Promise.all(
      children
        .filter((c) => c.parents.length < MAX_PARENTS_PER_CHILD)
        .map(async (c) => {
          const invites = (await getInvitations(c.id)) ?? [];
          return [c.id, invites.find((i) => i.status === INVITE_STATUSES.PENDING)] as const;
        }),
    ),
  );

  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">{t.parent.greeting(user.name)}</h1>
            <p className="page-subtitle">{t.parent.subtitle}</p>
          </div>
          {children.length > 0 && <AddChildDialog locale={locale} />}
        </div>

        {children.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Users size={28} aria-hidden />
            </span>
            <h2 className="section-title" style={{ margin: 0 }}>
              {t.parent.emptyTitle}
            </h2>
            <p>{t.parent.emptyBody}</p>
            <AddChildDialog locale={locale} />
          </div>
        ) : (
          <ul className="child-grid">
            {children.map((child) => (
              <ChildCard key={child.id} locale={locale} child={child} pendingInvite={pendingInvites.get(child.id)} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function ChildCard({
  locale,
  child,
  pendingInvite,
}: {
  locale: Locale;
  child: ChildDTO;
  pendingInvite?: InvitationDTO;
}) {
  const t = dictionaries[locale].parent;
  const fields = dictionaries[locale].fields;
  const age = ageInYears(child.birthDate);
  const canCreateLogin = !child.hasAccount && age >= MIN_CHILD_ACCOUNT_AGE;
  const canInvite = child.parents.length < MAX_PARENTS_PER_CHILD;

  return (
    <li className="card child-card">
      <div className="child-card-head">
        <Avatar name={child.name} id={child.id} size="lg" />
        <div>
          <h2 className="child-card-name">
            <bdi>{child.name}</bdi>
          </h2>
          <p className="child-card-meta">
            {t.age(age)} · {t.born(formatDate(child.birthDate, locale))}
          </p>
        </div>
      </div>

      <div className="chip-row">
        {child.hasAccount ? (
          <span className="chip chip-success">
            <CheckCircle2 size={14} aria-hidden />
            {t.hasAccount}
          </span>
        ) : (
          age < MIN_CHILD_ACCOUNT_AGE && <span className="chip">{t.managedByParents}</span>
        )}
        {pendingInvite && (
          <span className="chip chip-warning">
            <Clock size={14} aria-hidden />
            {t.pendingInvite}
          </span>
        )}
      </div>

      <div className="parents-row">
        <span className="avatar-stack">
          {child.parents.map((p) => (
            <Avatar key={p.id} name={p.name} id={p.id} size="sm" />
          ))}
        </span>
        <span>
          {child.parents.map((p, i) => (
            <span key={p.id}>
              {i > 0 && (locale === 'ar' ? '، ' : ', ')}
              <bdi>{p.name}</bdi> ({fields[p.role]})
            </span>
          ))}
        </span>
      </div>

      <div className="card-links">
        <Link href={`/parent/children/${child.id}/schedule`} className="card-link">
          <CalendarDays size={18} aria-hidden />
          {dictionaries[locale].schedule.open}
          <ChevronRight size={18} aria-hidden className="rtl-flip card-link-arrow" />
        </Link>
        <Link href={`/parent/children/${child.id}/day`} className="card-link">
          <ClipboardCheck size={18} aria-hidden />
          {dictionaries[locale].day.open}
          <ChevronRight size={18} aria-hidden className="rtl-flip card-link-arrow" />
        </Link>
        <Link href={`/parent/children/${child.id}/visits`} className="card-link">
          <House size={18} aria-hidden />
          {dictionaries[locale].visits.open}
          <ChevronRight size={18} aria-hidden className="rtl-flip card-link-arrow" />
        </Link>
      </div>

      {(canCreateLogin || canInvite) && (
        <ChildActions
          locale={locale}
          childId={child.id}
          childName={child.name}
          canCreateLogin={canCreateLogin}
          canInvite={canInvite}
          pendingInvite={
            pendingInvite
              ? { email: pendingInvite.email, until: formatDate(pendingInvite.expiresAt.slice(0, 10), locale) }
              : undefined
          }
        />
      )}
    </li>
  );
}
