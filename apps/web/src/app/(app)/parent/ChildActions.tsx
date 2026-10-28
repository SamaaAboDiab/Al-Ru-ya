'use client';

import { KeyRound, Send } from 'lucide-react';
import type { Locale } from '@ruya/shared';
import { Dialog } from '@/components/Dialog';
import { dictionaries } from '@/lib/i18n';
import { ChildAccountForm } from './ChildAccountForm';
import { InviteParentForm } from './InviteParentForm';

type Props = {
  locale: Locale;
  childId: string;
  childName: string;
  canCreateLogin: boolean;
  canInvite: boolean;
  pendingInvite?: { email: string; until: string };
};

export function ChildActions({ locale, childId, childName, canCreateLogin, canInvite, pendingInvite }: Props) {
  const t = dictionaries[locale];
  return (
    <div className="card-actions">
      {canCreateLogin && (
        <Dialog
          title={t.parent.createAccountTitle}
          description={t.parent.createAccountDesc(childName)}
          icon={<KeyRound size={22} aria-hidden />}
          closeLabel={t.close}
          trigger={(open) => (
            <button type="button" className="btn btn-soft btn-sm" onClick={open}>
              <KeyRound size={16} aria-hidden />
              {t.parent.createLogin}
            </button>
          )}
        >
          {(close) => <ChildAccountForm locale={locale} childId={childId} onDone={close} />}
        </Dialog>
      )}
      {canInvite && (
        <Dialog
          title={t.parent.inviteTitle}
          description={t.parent.inviteDesc(childName)}
          icon={<Send size={22} aria-hidden className="rtl-flip" />}
          closeLabel={t.close}
          trigger={(open) => (
            <button type="button" className="btn btn-secondary btn-sm" onClick={open}>
              <Send size={16} aria-hidden className="rtl-flip" />
              {t.parent.invite}
            </button>
          )}
        >
          {(close) => (
            <InviteParentForm locale={locale} childId={childId} pendingInvite={pendingInvite} onDone={close} />
          )}
        </Dialog>
      )}
    </div>
  );
}
