import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OtherSignIn } from '@/components/auth/OtherSignIn';
import { AuthShell } from '@/components/AuthShell';
import { homeFor, safeNext } from '@/lib/routes';
import { getAuthMethods, getCurrentUser, getDictionary, getLocale } from '@/lib/server';
import { LoginForm } from './LoginForm';

type SearchParams = Promise<{ next?: string | string[]; email?: string | string[] }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const next = safeNext(query.next);
  const email = typeof query.email === 'string' ? query.email : undefined;

  const [user, methods] = await Promise.all([getCurrentUser(), getAuthMethods()]);
  if (user) redirect(next ?? homeFor(user.role));

  const locale = await getLocale();
  const t = await getDictionary();
  const carry = new URLSearchParams({ ...(next && { next }), ...(email && { email }) }).toString();
  return (
    <AuthShell locale={locale}>
      <div>
        <h1 className="auth-title">{t.login.title}</h1>
        <p className="auth-subtitle">{t.login.subtitle}</p>
      </div>
      <LoginForm locale={locale} next={next} email={email} />
      <OtherSignIn locale={locale} methods={methods} next={next} />
      <p className="auth-footer">
        {t.login.noAccount} <Link href={`/register${carry ? `?${carry}` : ''}`}>{t.login.toRegister}</Link>
      </p>
    </AuthShell>
  );
}
