import { redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { LanguageChoice } from '@/components/account/LanguageChoice';
import { AppHeader } from '@/components/AppHeader';
import { BackLink } from '@/components/BackLink';
import { dictionaries } from '@/lib/i18n';
import { getCurrentUser, getLocale } from '@/lib/server';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  const t = dictionaries[locale];
  const a = t.account;

  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page page-narrow">
        <BackLink href="/account" label={a.title} />
        <div className="page-head">
          <div>
            <h1 className="page-title">{a.settings}</h1>
            <p className="page-subtitle">{a.settingsSubtitle}</p>
          </div>
        </div>

        <div className="stack">
          <section className="card">
            <LanguageChoice locale={locale} />
          </section>

          <section className="card">
            <h2 className="section-title">{a.details}</h2>
            <dl className="details-list">
              <div>
                <dt>{a.name}</dt>
                <dd>
                  <bdi>{user.name}</bdi>
                </dd>
              </div>
              <div>
                <dt>{a.email}</dt>
                <dd className="ltr">{user.email}</dd>
              </div>
              <div>
                <dt>{a.role}</dt>
                <dd>{user.role === ROLES.CHILD ? t.nav.child : t.fields[user.role as 'mother' | 'father']}</dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
    </>
  );
}
