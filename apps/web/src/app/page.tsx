import { redirect } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LogoMark } from '@/components/Logo';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getDictionary, getLocale } from '@/lib/server';
import { WelcomeActions } from './WelcomeActions';

/** The screen the app opens on. Signed-in users go straight to their page. */
export default async function Welcome() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  const locale = await getLocale();
  const t = await getDictionary();
  return (
    <main className="welcome">
      <div className="welcome-lang">
        <LanguageSwitcher locale={locale} variant="on-dark" />
      </div>

      <div className="welcome-hero">
        <LogoMark size={150} className="welcome-logo" />
        <h1 className="welcome-name">{t.appName}</h1>
        <p className="welcome-sub">{t.appSubtitle}</p>
        <p className="welcome-tagline">{t.welcome.tagline}</p>
      </div>

      <WelcomeActions locale={locale} />
    </main>
  );
}
