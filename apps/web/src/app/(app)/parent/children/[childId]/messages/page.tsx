import { notFound, redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { ChildContext } from '@/components/ChildContext';
import { Forbidden } from '@/components/Forbidden';
import { FormAlert } from '@/components/FormAlert';
import { ChatThread } from '@/components/messages/ChatThread';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getChild, getCurrentUser, getLocale, getMessages } from '@/lib/server';

/** US-14/15: a parent's own conversation with the child. The other parent's is never shown. */
export default async function ParentChatPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;

  const [child, messages] = await Promise.all([getChild(childId), getMessages(childId, user.id)]);
  if (!child || !messages) notFound();
  const t = dictionaries[locale];

  return (
    <>
      <main className="page page-chat">
        <ChildContext locale={locale} child={child} active="messages" />
        <div className="content-narrow">
          {!child.hasAccount && <FormAlert tone="warning">{t.messages.noAccount}</FormAlert>}
          <ChatThread
            locale={locale}
            childId={childId}
            parentId={user.id}
            initial={messages}
            privacyNote={t.messages.privateParent}
            showPresets
          />
        </div>
      </main>
    </>
  );
}
