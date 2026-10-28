import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
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
    <AuthShell locale={locale}>
      <div>
        <h1 className="auth-title">{t.register.title}</h1>
        <p className="auth-subtitle">{t.register.subtitle}</p>
      </div>
      <RegisterForm locale={locale} next={next} email={email} />
      <p className="auth-footer">
        {t.register.haveAccount} <Link href={`/login${carry ? `?${carry}` : ''}`}>{t.register.toLogin}</Link>
      </p>
    </AuthShell>
  );
}
