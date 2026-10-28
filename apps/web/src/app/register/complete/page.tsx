import { Clock } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { dictionaries } from '@/lib/i18n';
import { homeFor, safeNext } from '@/lib/routes';
import { getCurrentUser, getLocale, getSignupDraft } from '@/lib/server';
import { CompleteForm } from './CompleteForm';

type SearchParams = Promise<{ next?: string | string[] }>;

/** The last step for a newcomer who proved who they are with a link, Google or a phone code. */
export default async function CompleteSignupPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNext((await searchParams).next);
  const [user, draft, locale] = await Promise.all([getCurrentUser(), getSignupDraft(), getLocale()]);
  if (user) redirect(next ?? homeFor(user.role));
  const s = dictionaries[locale].signin;

  return (
    <AuthShell locale={locale}>
      {draft ? (
        <>
          <div>
            <h1 className="auth-title">{s.completeTitle}</h1>
            <p className="auth-subtitle">{s.completeSubtitle}</p>
          </div>
          <CompleteForm locale={locale} draft={draft} next={next} />
        </>
      ) : (
        <div className="auth-done">
          <span className="auth-done-icon auth-done-icon-info">
            <Clock size={26} aria-hidden />
          </span>
          <h1 className="auth-title">{s.expiredTitle}</h1>
          <p className="auth-subtitle">{s.expiredBody}</p>
          <Link href="/login" className="btn btn-primary btn-lg btn-block">
            {s.startAgain}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
