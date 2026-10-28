import Link from 'next/link';
import { INVITE_STATUSES, ROLES } from '@ruya/shared';
import { LogoutButton } from '@/components/LogoutButton';
import { TopBar } from '@/components/TopBar';
import { formatDate } from '@/lib/i18n';
import { getCurrentUser, getDictionary, getInvitationPreview, getLocale } from '@/lib/server';
import { AcceptInviteButton } from './AcceptInviteButton';

/** US-04: where the invited parent lands from the email or a shared link. */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [locale, t, preview, user] = await Promise.all([
    getLocale(),
    getDictionary(),
    getInvitationPreview(token),
    getCurrentUser(),
  ]);
  const p = t.invitePage;
  const here = `/invite/${encodeURIComponent(token)}`;

  function body() {
    if (!preview) {
      return (
        <>
          <h1>{p.invalidTitle}</h1>
          <p className="muted">{p.invalid}</p>
        </>
      );
    }
    if (preview.status === INVITE_STATUSES.EXPIRED) {
      return <p className="alert alert-error">{p.expired(preview.inviterName)}</p>;
    }
    if (preview.status !== INVITE_STATUSES.PENDING) {
      return <p className="alert alert-error">{p.used}</p>;
    }

    const authQuery = `?next=${encodeURIComponent(here)}&email=${encodeURIComponent(preview.email)}`;
    return (
      <>
        <h1>{p.title(preview.inviterName, preview.childName)}</h1>
        <p className="muted">{p.body}</p>
        <dl className="invite-facts">
          <dt>{p.sentTo}</dt>
          <dd className="ltr">{preview.email}</dd>
          <dt>{p.validUntil}</dt>
          <dd>{formatDate(preview.expiresAt.slice(0, 10), locale)}</dd>
        </dl>

        {!user ? (
          <div className="stack">
            <Link href={`/register${authQuery}`} className="btn btn-primary btn-link">
              {p.createAccount}
            </Link>
            <Link href={`/login${authQuery}`} className="btn btn-ghost btn-link">
              {p.signIn}
            </Link>
          </div>
        ) : user.role === ROLES.CHILD ? (
          <p className="alert alert-error">{p.childAccount}</p>
        ) : user.email !== preview.email ? (
          <div className="stack">
            <p className="alert alert-error">{p.wrongAccount(user.email, preview.email)}</p>
            <LogoutButton locale={locale} redirectTo={`/login${authQuery}`} />
          </div>
        ) : (
          <AcceptInviteButton locale={locale} token={token} />
        )}
      </>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <TopBar locale={locale} signedIn={false} />
        <div className="card stack">{body()}</div>
      </div>
    </main>
  );
}
