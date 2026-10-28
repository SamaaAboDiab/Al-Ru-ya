import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getDictionary, getLocale } from '@/lib/server';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
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
            <h1>{t.login.title}</h1>
            <p className="muted">{t.login.subtitle}</p>
          </div>
          <LoginForm locale={locale} />
          <p className="muted">
            {t.login.noAccount} <Link href="/register">{t.login.toRegister}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
