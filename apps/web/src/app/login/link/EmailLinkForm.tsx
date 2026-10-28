'use client';

import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import type { Locale } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

type Props = { locale: Locale; next?: string; email?: string };

/** Asks for an email and sends a one-time sign-in link; newcomers get one that starts an account. */
export function EmailLinkForm({ locale, next, email }: Props) {
  const t = dictionaries[locale];
  const s = t.signin;
  const { pending, formError, fieldErrors, submit } = useApiForm<void>(locale);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  async function send(address: string) {
    const result = await submit('/api/auth/email-link', { email: address, locale, ...(next ? { next } : {}) });
    if (result.ok) setSentTo(address.trim().toLowerCase());
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await send(String(new FormData(e.currentTarget).get('email') ?? ''));
  }

  if (sentTo) {
    return (
      <div className="auth-done">
        <span className="auth-done-icon">
          <MailCheck size={28} aria-hidden />
        </span>
        <h1 className="auth-title">{s.linkSentTitle}</h1>
        <p className="auth-subtitle">{s.linkSentBody(sentTo)}</p>
        <p className="auth-footer">
          {t.reset.sentHint}{' '}
          <button type="button" className="link-btn" onClick={() => send(sentTo)} disabled={pending}>
            {t.reset.resend}
          </button>
        </p>
        <Link href={loginHref} className="btn btn-secondary btn-block">
          {t.reset.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="auth-title">{s.linkTitle}</h1>
        <p className="auth-subtitle">{s.linkSubtitle}</p>
      </div>
      <form className="form" onSubmit={onSubmit} noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field
          label={t.fields.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          dir="ltr"
          required
          autoFocus
          defaultValue={email}
          error={fieldErrors.email}
        />
        <SubmitButton className="btn btn-primary btn-lg btn-block" loading={pending}>
          {s.linkSend}
        </SubmitButton>
      </form>
      <p className="auth-footer">
        <Link href={loginHref}>{s.usePassword}</Link>
      </p>
    </>
  );
}
