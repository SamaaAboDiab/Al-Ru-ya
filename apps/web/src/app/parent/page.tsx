import { redirect } from 'next/navigation';
import {
  INVITE_STATUSES,
  MAX_PARENTS_PER_CHILD,
  MIN_CHILD_ACCOUNT_AGE,
  ROLES,
  ageInYears,
} from '@ruya/shared';
import { Forbidden } from '@/components/Forbidden';
import { TopBar } from '@/components/TopBar';
import { formatDate } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getDictionary, getInvitations, getLocale, getMyChildren } from '@/lib/server';
import { AddChildForm } from './AddChildForm';
import { ChildAccountForm } from './ChildAccountForm';
import { InviteParentForm } from './InviteParentForm';

export default async function ParentPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;

  const t = await getDictionary();
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
    <main className="page">
      <TopBar locale={locale} signedIn />
      <h1 style={{ marginBlockEnd: 'var(--space-5)' }}>
        {t.parent.greeting(user.name)}
      </h1>

      <div className="grid-2">
        <section className="card" aria-labelledby="children-title">
          <h2 id="children-title" className="section-title">
            {t.parent.childrenTitle}
          </h2>
          {children.length === 0 ? (
            <p className="empty muted">{t.parent.noChildren}</p>
          ) : (
            <ul className="child-list">
              {children.map((child) => {
                const age = ageInYears(child.birthDate);
                return (
                  <li key={child.id} className="child-item">
                    <div className="child-head">
                      <span className="avatar" aria-hidden>
                        {child.name.charAt(0)}
                      </span>
                      <div>
                        <strong>
                          <bdi>{child.name}</bdi>
                        </strong>
                        <div className="muted">
                          {t.parent.age(age)} · {formatDate(child.birthDate, locale)}
                        </div>
                      </div>
                    </div>
                    {child.hasAccount ? (
                      <span className="badge badge-success" style={{ alignSelf: 'start' }}>
                        {t.parent.hasAccount}
                      </span>
                    ) : age >= MIN_CHILD_ACCOUNT_AGE ? (
                      <ChildAccountForm locale={locale} childId={child.id} />
                    ) : (
                      <span className="badge" style={{ alignSelf: 'start' }}>
                        {t.parent.managedByParents}
                      </span>
                    )}
                    <p className="muted linked-parents">
                      {t.parent.linkedParents}{' '}
                      {child.parents.map((p, i) => (
                        <span key={p.id}>
                          {i > 0 && (locale === 'ar' ? '، ' : ', ')}
                          <bdi>{p.name}</bdi> ({t.fields[p.role]})
                        </span>
                      ))}
                    </p>
                    {child.parents.length < MAX_PARENTS_PER_CHILD && (
                      <div className="invite-box">
                        {pendingInvites.get(child.id) && (
                          <p className="muted hint-text">
                            {t.parent.pendingInvite(
                              pendingInvites.get(child.id)!.email,
                              formatDate(pendingInvites.get(child.id)!.expiresAt.slice(0, 10), locale),
                            )}
                          </p>
                        )}
                        <InviteParentForm locale={locale} childId={child.id} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="add-child-title">
          <h2 id="add-child-title" className="section-title">
            {t.parent.addChildTitle}
          </h2>
          <AddChildForm locale={locale} />
        </section>
      </div>
    </main>
  );
}
