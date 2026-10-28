import { redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { BackButton } from '@/components/BackButton';
import { LanguageChoice } from '@/components/account/LanguageChoice';
import { ProfilePhoto } from '@/components/account/ProfilePhoto';
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
      <main className="page page-narrow">
        <div className="page-head">
          <BackButton href="/account" label={a.title} />
          <div>
            <h1 className="page-title">{a.settings}</h1>
            <p className="page-subtitle">{a.settingsSubtitle}</p>
          </div>
        </div>

        <div className="stack">
          <ProfilePhoto locale={locale} user={user} isChild={user.role === ROLES.CHILD} />

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
