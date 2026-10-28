'use client';

import { useState, type FormEvent } from 'react';
import type { InvitationDTO, Locale } from '@ruya/shared';
import { Field } from '@/components/Field';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

/** US-04: invite the other parent to link to this child. */
export function InviteParentForm({ locale, childId }: { locale: Locale; childId: string }) {
  const t = dictionaries[locale].parent;
  const fields = dictionaries[locale].fields;
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

  if (sent?.inviteUrl) {
    return (
      <div className="alert alert-success stack" role="status">
        <span>{t.inviteSent(sent.email)}</span>
        <code className="invite-link ltr">{sent.inviteUrl}</code>
        <button type="button" className="btn btn-ghost" onClick={() => copy(sent.inviteUrl!)}>
          {copied ? t.copied : t.copyLink}
        </button>
      </div>
    );
  }

  return (
    <form className="stack invite-form" onSubmit={onSubmit} noValidate aria-label={t.inviteTitle}>
      <div>
        <strong>{t.inviteTitle}</strong>
        <p className="muted hint-text">{t.inviteHint}</p>
      </div>
      {formError && <p className="alert alert-error" role="alert">{formError}</p>}
      <Field
        label={t.inviteEmail}
        name="email"
        type="email"
        autoComplete="off"
        dir="ltr"
        required
        error={fieldErrors.email ?? (fieldErrors._ ? fields.email : undefined)}
      />
      <button type="submit" className="btn btn-ghost" disabled={pending}>
        {t.sendInvite}
      </button>
    </form>
  );
}
