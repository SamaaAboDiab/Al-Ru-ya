import { CalendarDays, CheckCircle2, ClipboardCheck, Clock, House, MessageCircle, Users } from 'lucide-react';
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
import { Avatar } from '@/components/Avatar';
import { Forbidden } from '@/components/Forbidden';
import { HomeHero, nextUpcoming, type HomeVisit } from '@/components/HomeHero';
import { dictionaries, formatDate, formatNumber } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getConversations, getCurrentUser, getInvitations, getLocale, getMyChildren, getVisits } from '@/lib/server';
import { AddChildDialog } from './AddChildDialog';
import { ChildActions } from './ChildActions';

type ChildExtras = { pendingInvite?: InvitationDTO; unread: number; toConfirm: number };

export default async function ParentPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;

  const t = dictionaries[locale];
  const children = (await getMyChildren()) ?? [];

  // One round of requests per child: visits (for the hero), unread messages, open invitations.
  const perChild = await Promise.all(
    children.map(async (c) => {
      const [visits, conversations, invites] = await Promise.all([
        getVisits(c.id),
        getConversations(c.id),
        c.parents.length < MAX_PARENTS_PER_CHILD ? getInvitations(c.id) : Promise.resolve(null),
      ]);
      const list = visits ?? [];
      const extras: ChildExtras = {
        pendingInvite: invites?.find((i) => i.status === INVITE_STATUSES.PENDING),
        unread: (conversations ?? []).reduce((sum, conv) => sum + conv.unread, 0),
        toConfirm: list.filter((v) => v.canConfirm).length,
      };
      const homeVisits: HomeVisit[] = list.map((visit) => ({
        visit,
        childName: c.name,
        href: `/parent/children/${c.id}/visits/${visit.id}`,
      }));
      return { child: c, extras, homeVisits };
    }),
  );

  const next = nextUpcoming(perChild.flatMap((p) => p.homeVisits));
  const toConfirm = perChild.reduce((sum, p) => sum + p.extras.toConfirm, 0);
  const firstToConfirm = perChild.find((p) => p.extras.toConfirm > 0);

  return (
    <>
      <main className="page">
        <HomeHero
          locale={locale}
          title={t.parent.greeting(user.name)}
          subtitle={t.parent.subtitle}
          next={next}
          withLabel={(v) => `${v.childName}, ${t.home.withParent(v.visit.parent.name)}`}
          toConfirm={
            firstToConfirm
              ? { count: toConfirm, href: `/parent/children/${firstToConfirm.child.id}/visits?status=pending` }
              : undefined
          }
        />

        <div className="section-head">
          <h2 className="section-title">{t.nav.myChildren}</h2>
          {children.length > 0 && <AddChildDialog locale={locale} />}
        </div>

        {children.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Users size={28} aria-hidden />
            </span>
            <h3 className="section-title" style={{ margin: 0 }}>
              {t.parent.emptyTitle}
            </h3>
            <p>{t.parent.emptyBody}</p>
            <AddChildDialog locale={locale} />
          </div>
        ) : (
          <ul className="child-grid">
            {perChild.map(({ child, extras }) => (
              <ChildCard key={child.id} locale={locale} child={child} extras={extras} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function ChildCard({ locale, child, extras }: { locale: Locale; child: ChildDTO; extras: ChildExtras }) {
  const t = dictionaries[locale];
  const p = t.parent;
  const age = ageInYears(child.birthDate);
  const canCreateLogin = !child.hasAccount && age >= MIN_CHILD_ACCOUNT_AGE;
  const canInvite = child.parents.length < MAX_PARENTS_PER_CHILD;
  const base = `/parent/children/${child.id}`;
  const links = [
    { href: `${base}/schedule`, label: t.schedule.open, Icon: CalendarDays, count: 0 },
    { href: `${base}/day`, label: t.day.open, Icon: ClipboardCheck, count: 0 },
    { href: `${base}/visits`, label: t.visits.open, Icon: House, count: extras.toConfirm },
    { href: `${base}/messages`, label: t.messages.open, Icon: MessageCircle, count: extras.unread },
  ];

  return (
    <li className="card child-card">
      <div className="child-card-head">
        <Avatar name={child.name} id={child.id} photo={child.photoUrl} size="lg" />
        <div className="child-card-id">
          <h3 className="child-card-name">
            {/* Stretched over the card head: tapping the name, avatar or details opens the child page. */}
            <Link href={base} className="child-card-open">
              <bdi>{child.name}</bdi>
            </Link>
          </h3>
          <p className="child-card-meta">{p.age(age)}</p>
          <p className="child-card-sub">{p.born(formatDate(child.birthDate, locale))}</p>
          <div className="child-card-status">
            {child.hasAccount ? (
              <span className="chip chip-success">
                <CheckCircle2 size={14} aria-hidden />
                {p.hasAccount}
              </span>
            ) : (
              age < MIN_CHILD_ACCOUNT_AGE && <span className="chip">{p.managedByParents}</span>
            )}
            {extras.pendingInvite && (
              <span className="chip chip-warning">
                <Clock size={14} aria-hidden />
                {p.pendingInvite}
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className="card-links" aria-label={child.name}>
        {links.map(({ href, label, Icon, count }) => (
          <Link key={href} href={href} className="card-link">
            <Icon size={18} aria-hidden />
            <span>{label}</span>
            {count > 0 && <span className="count-badge">{formatNumber(count, locale)}</span>}
          </Link>
        ))}
      </nav>

      <div className="parents-row">
        <span className="avatar-stack">
          {child.parents.map((parent) => (
            <Avatar key={parent.id} name={parent.name} id={parent.id} photo={parent.photoUrl} size="sm" />
          ))}
        </span>
        <span className="parents-names">
          {child.parents.map((parent, i) => (
            <span key={parent.id}>
              {i > 0 && (locale === 'ar' ? '، ' : ', ')}
              <bdi>{parent.name}</bdi> ({t.fields[parent.role]})
            </span>
          ))}
        </span>
      </div>

      {(canCreateLogin || canInvite) && (
        <ChildActions
          locale={locale}
          childId={child.id}
          childName={child.name}
          canCreateLogin={canCreateLogin}
          canInvite={canInvite}
          pendingInvite={
            extras.pendingInvite
              ? {
                  email: extras.pendingInvite.email,
                  until: formatDate(extras.pendingInvite.expiresAt.slice(0, 10), locale),
                }
              : undefined
          }
        />
      )}
    </li>
  );
}
