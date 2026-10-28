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

/** Asks for the email, then says the same thing whether or not it has an account. */
export function ForgotForm({ locale, email }: { locale: Locale; email?: string }) {
  const t = dictionaries[locale];
  const r = t.reset;
  const { pending, formError, fieldErrors, submit } = useApiForm<void>(locale);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function send(address: string) {
    const result = await submit('/api/auth/forgot-password', { email: address });
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
        <h1 className="auth-title">{r.sentTitle}</h1>
        <p className="auth-subtitle">
          {r.sentBody(sentTo)}
        </p>
        <p className="auth-footer">
          {r.sentHint}{' '}
          <button type="button" className="link-btn" onClick={() => send(sentTo)} disabled={pending}>
            {r.resend}
          </button>
        </p>
        <Link href={`/login?email=${encodeURIComponent(sentTo)}`} className="btn btn-secondary btn-block">
          {r.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="auth-title">{r.forgotTitle}</h1>
        <p className="auth-subtitle">{r.forgotSubtitle}</p>
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
          {r.send}
        </SubmitButton>
      </form>
      <p className="auth-footer">
        <Link href="/login">{r.backToLogin}</Link>
      </p>
    </>
  );
}
