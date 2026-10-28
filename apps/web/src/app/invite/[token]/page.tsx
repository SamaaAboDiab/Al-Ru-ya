import { CircleSlash, Clock, LinkIcon, MailCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { INVITE_STATUSES, ROLES } from '@ruya/shared';
import { AuthShell } from '@/components/AuthShell';
import { FormAlert } from '@/components/FormAlert';
import { LogoutButton } from '@/components/LogoutButton';
import { formatDate } from '@/lib/i18n';
import { getCurrentUser, getDictionary, getInvitationPreview, getLocale } from '@/lib/server';
import { AcceptInviteButton } from './AcceptInviteButton';

function StatusBlock({ icon, title, body, danger }: { icon: ReactNode; title: string; body: string; danger?: boolean }) {
  return (
    <div className="stack" style={{ alignItems: 'flex-start' }}>
      <span className={danger ? 'status-icon status-icon-danger' : 'status-icon'}>{icon}</span>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{body}</p>
    </div>
  );
}

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
      return <StatusBlock danger icon={<LinkIcon size={26} aria-hidden />} title={p.invalidTitle} body={p.invalid} />;
    }
    if (preview.status === INVITE_STATUSES.EXPIRED) {
      return (
        <StatusBlock
          danger
          icon={<Clock size={26} aria-hidden />}
          title={p.expiredTitle}
          body={p.expired(preview.inviterName)}
        />
      );
    }
    if (preview.status !== INVITE_STATUSES.PENDING) {
      return <StatusBlock icon={<CircleSlash size={26} aria-hidden />} title={p.usedTitle} body={p.used} />;
    }

    const authQuery = `?next=${encodeURIComponent(here)}&email=${encodeURIComponent(preview.email)}`;
    return (
      <>
        <div className="stack" style={{ alignItems: 'flex-start' }}>
          <span className="status-icon">
            <MailCheck size={26} aria-hidden />
          </span>
          <h1 className="auth-title">{p.title(preview.inviterName, preview.childName)}</h1>
          <p className="auth-subtitle">{p.body}</p>
        </div>
        <dl className="invite-facts">
          <dt>{p.sentTo}</dt>
          <dd className="ltr">{preview.email}</dd>
          <dt>{p.validUntil}</dt>
          <dd>{formatDate(preview.expiresAt.slice(0, 10), locale)}</dd>
        </dl>

        {!user ? (
          <div className="stack">
            <Link href={`/register${authQuery}`} className="btn btn-primary btn-lg btn-block">
              {p.createAccount}
            </Link>
            <Link href={`/login${authQuery}`} className="btn btn-secondary btn-lg btn-block">
              {p.signIn}
            </Link>
          </div>
        ) : user.role === ROLES.CHILD ? (
          <FormAlert>{p.childAccount}</FormAlert>
        ) : user.email !== preview.email ? (
          <div className="stack">
            <FormAlert tone="warning">{p.wrongAccount(user.email, preview.email)}</FormAlert>
            <LogoutButton locale={locale} redirectTo={`/login${authQuery}`} />
          </div>
        ) : (
          <AcceptInviteButton locale={locale} token={token} />
        )}
      </>
    );
  }

  return <AuthShell locale={locale}>{body()}</AuthShell>;
}
