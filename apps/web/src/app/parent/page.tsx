import { redirect } from 'next/navigation';
import { MIN_CHILD_ACCOUNT_AGE, ROLES, ageInYears } from '@ruya/shared';
import { Forbidden } from '@/components/Forbidden';
import { TopBar } from '@/components/TopBar';
import { formatDate } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getDictionary, getLocale, getMyChildren } from '@/lib/server';
import { AddChildForm } from './AddChildForm';
import { ChildAccountForm } from './ChildAccountForm';

export default async function ParentPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;

  const t = await getDictionary();
  const children = (await getMyChildren()) ?? [];

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
