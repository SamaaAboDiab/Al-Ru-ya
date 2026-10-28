import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { dictionaries } from '@/lib/i18n';
import { homeFor, safeNext } from '@/lib/routes';
import { getCurrentUser, getLocale } from '@/lib/server';
import { PhoneSignIn } from './PhoneSignIn';

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function PhoneSignInPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNext((await searchParams).next);
  const user = await getCurrentUser();
  if (user) redirect(next ?? homeFor(user.role));

  const locale = await getLocale();
  const t = dictionaries[locale];
  return (
    <AuthShell locale={locale}>
      <div>
        <h1 className="auth-title">{t.phone.title}</h1>
        <p className="auth-subtitle">{t.phone.subtitle}</p>
      </div>
      <PhoneSignIn locale={locale} next={next} />
      <p className="auth-footer">
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>{t.signin.usePassword}</Link>
      </p>
    </AuthShell>
  );
}
