'use client';

import { Check, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { InvitationDTO, Locale } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

type Props = {
  locale: Locale;
  childId: string;
  pendingInvite?: { email: string; until: string };
  onDone: () => void;
};

/** US-04: invite the other parent to link to this child. */
export function InviteParentForm({ locale, childId, pendingInvite, onDone }: Props) {
  const t = dictionaries[locale];
  const router = useRouter();
  const [sent, setSent] = useState<InvitationDTO | null>(null);
  const [copied, setCopied] = useState(false);
  const { pending, formError, fieldErrors, submit } = useApiForm<InvitationDTO>(locale);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await submit(`/api/children/${childId}/invitations`, { email: form.get('email') });
    if (result.ok) setSent(result.data);
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard blocked: the link is still visible and selectable.
    }
  }

  function finish() {
    onDone();
    router.refresh();
  }

  if (sent?.inviteUrl) {
    return (
      <div className="stack">
        <FormAlert tone="success">{t.parent.inviteSent(sent.email)}</FormAlert>
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          {t.parent.inviteShare}
        </p>
        <div className="copy-row">
          <code className="ltr">{sent.inviteUrl}</code>
          <button type="button" className="btn btn-secondary" onClick={() => copy(sent.inviteUrl!)}>
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            {copied ? t.parent.copied : t.parent.copyLink}
          </button>
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={finish}>
          {t.parent.done}
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {pendingInvite && (
        <FormAlert tone="warning">{t.parent.pendingInviteLine(pendingInvite.email, pendingInvite.until)}</FormAlert>
      )}
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field
        label={t.parent.inviteEmail}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="off"
        placeholder="name@example.com"
        dir="ltr"
        required
        autoFocus
        error={fieldErrors.email}
      />
      <SubmitButton className="btn btn-primary btn-block" loading={pending}>
        {t.parent.sendInvite}
      </SubmitButton>
    </form>
  );
}
