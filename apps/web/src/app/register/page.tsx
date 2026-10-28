import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getDictionary, getLocale } from '@/lib/server';
import { RegisterForm } from './RegisterForm';

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  const locale = await getLocale();
  const t = await getDictionary();
  return (
    <main className="auth-page">
      <div className="auth-card">
        <TopBar locale={locale} signedIn={false} />
        <div className="card stack">
          <div>
            <h1>{t.register.title}</h1>
            <p className="muted">{t.register.subtitle}</p>
          </div>
          <RegisterForm locale={locale} />
          <p className="muted">
            {t.register.haveAccount} <Link href="/login">{t.register.toLogin}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
