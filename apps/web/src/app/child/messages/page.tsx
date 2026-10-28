import { ChevronRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { BackLink } from '@/components/BackLink';
import { Forbidden } from '@/components/Forbidden';
import { dictionaries, formatClock, formatNumber } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getConversations, getCurrentUser, getLocale } from '@/lib/server';

/** US-14: one conversation per parent, never mixed. */
export default async function MyMessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role !== ROLES.CHILD || !user.childId) {
    return <Forbidden locale={locale} user={user} homeHref={homeFor(user.role)} />;
  }

  const t = dictionaries[locale];
  const conversations = (await getConversations(user.childId)) ?? [];

  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page page-narrow">
        <BackLink href="/child" label={t.schedule.back} />
        <div className="page-head">
          <div>
            <h1 className="page-title">{t.messages.myTitle}</h1>
            <p className="page-subtitle">{t.messages.mySubtitle}</p>
          </div>
        </div>

        <ul className="convo-list">
          {conversations.map((c) => (
            <li key={c.parent.id}>
              <Link href={`/child/messages/${c.parent.id}`} className="card convo">
                <Avatar name={c.parent.name} id={c.parent.id} size="lg" />
                <span className="convo-text">
                  <span className="convo-name">
                    <bdi>{c.parent.name}</bdi> <span className="muted">({t.fields[c.parent.role]})</span>
                  </span>
                  <span className="convo-last" dir="auto">
                    {c.lastMessage ? (
                      <>
                        {c.lastMessage.fromMe && t.messages.you}
                        {c.lastMessage.body}
                      </>
                    ) : (
                      t.messages.noMessages
                    )}
                  </span>
                </span>
                <span className="convo-end">
                  {c.lastMessage && <span className="convo-time">{formatClock(c.lastMessage.createdAt, locale)}</span>}
                  {c.unread > 0 ? (
                    <span className="convo-badge" aria-label={t.messages.unread(c.unread)}>
                      {formatNumber(c.unread, locale)}
                    </span>
                  ) : (
                    <ChevronRight size={18} aria-hidden className="rtl-flip muted" />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {conversations.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">
              <MessageCircle size={28} aria-hidden />
            </span>
            <p>{t.messages.empty}</p>
          </div>
        )}
      </main>
    </>
  );
}
