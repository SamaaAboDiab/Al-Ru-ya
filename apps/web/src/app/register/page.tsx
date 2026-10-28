import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { homeFor, safeNext } from '@/lib/routes';
import { getCurrentUser, getDictionary, getLocale } from '@/lib/server';
import { RegisterForm } from './RegisterForm';

type SearchParams = Promise<{ next?: string | string[]; email?: string | string[] }>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const next = safeNext(query.next);
  const email = typeof query.email === 'string' ? query.email : undefined;

  const user = await getCurrentUser();
  if (user) redirect(next ?? homeFor(user.role));

  const locale = await getLocale();
  const t = await getDictionary();
  const carry = new URLSearchParams({ ...(next && { next }), ...(email && { email }) }).toString();
  return (
    <main className="auth-page">
      <div className="auth-card">
        <TopBar locale={locale} signedIn={false} />
        <div className="card stack">
          <div>
            <h1>{t.register.title}</h1>
            <p className="muted">{t.register.subtitle}</p>
          </div>
          <RegisterForm locale={locale} next={next} email={email} />
          <p className="muted">
            {t.register.haveAccount} <Link href={`/login${carry ? `?${carry}` : ''}`}>{t.register.toLogin}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
