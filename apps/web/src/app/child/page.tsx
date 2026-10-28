import { redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { Forbidden } from '@/components/Forbidden';
import { TopBar } from '@/components/TopBar';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getDictionary, getLocale } from '@/lib/server';

export default async function ChildPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role !== ROLES.CHILD) return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;

  const t = await getDictionary();
  return (
    <main className="page">
      <TopBar locale={locale} signedIn />
      <section className="card stack">
        <h1>{t.child.greeting(user.name)}</h1>
        <p className="muted">{t.child.intro}</p>
      </section>
    </main>
  );
}
