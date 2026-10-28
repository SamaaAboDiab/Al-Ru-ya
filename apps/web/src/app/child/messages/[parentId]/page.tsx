import { notFound, redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { BackLink } from '@/components/BackLink';
import { Forbidden } from '@/components/Forbidden';
import { ChatThread } from '@/components/messages/ChatThread';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getChild, getCurrentUser, getLocale, getMessages } from '@/lib/server';

/** US-14: the child's private conversation with one parent. */
export default async function ChildChatPage({ params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role !== ROLES.CHILD || !user.childId) {
    return <Forbidden locale={locale} user={user} homeHref={homeFor(user.role)} />;
  }

  const [child, messages] = await Promise.all([getChild(user.childId), getMessages(user.childId, parentId)]);
  const parent = child?.parents.find((p) => p.id === parentId);
  if (!parent || !messages) notFound();
  const t = dictionaries[locale];

  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page page-narrow page-chat">
        <BackLink href="/child/messages" label={t.messages.myTitle} />
        <div className="chat-head">
          <Avatar name={parent.name} id={parent.id} size="lg" />
          <div>
            <h1 className="page-title">
              <bdi>{parent.name}</bdi>
            </h1>
            <p className="page-subtitle">{t.fields[parent.role]}</p>
          </div>
        </div>
        <ChatThread
          locale={locale}
          childId={user.childId}
          parentId={parentId}
          initial={messages}
          privacyNote={t.messages.privateWith(parent.name)}
          showPresets={false}
        />
      </main>
    </>
  );
}
