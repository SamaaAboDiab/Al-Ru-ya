import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { homeFor, safeNext } from '@/lib/routes';
import { getCurrentUser, getDictionary, getLocale } from '@/lib/server';
import { LoginForm } from './LoginForm';

type SearchParams = Promise<{ next?: string | string[]; email?: string | string[] }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
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
            <h1>{t.login.title}</h1>
            <p className="muted">{t.login.subtitle}</p>
          </div>
          <LoginForm locale={locale} next={next} email={email} />
          <p className="muted">
            {t.login.noAccount} <Link href={`/register${carry ? `?${carry}` : ''}`}>{t.login.toRegister}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
