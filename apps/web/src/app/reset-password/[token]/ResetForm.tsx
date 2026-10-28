'use client';

import { CircleCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import type { Locale } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

export function ResetForm({ locale, token }: { locale: Locale; token: string }) {
  const t = dictionaries[locale];
  const r = t.reset;
  const { pending, formError, fieldErrors, submit } = useApiForm<void>(locale);
  const [mismatch, setMismatch] = useState(false);
  const [linkBroken, setLinkBroken] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password !== form.get('confirm')) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    const result = await submit('/api/auth/reset-password', { token, password });
    if (result.ok) setDone(true);
    // A mangled link fails validation on the token; treat it like an expired one.
    else if (result.code === 'RESET_LINK_INVALID' || result.fields?.token) setLinkBroken(true);
  }

  if (done) {
    return (
      <div className="auth-done">
        <span className="auth-done-icon">
          <CircleCheck size={28} aria-hidden />
        </span>
        <h1 className="auth-title">{r.doneTitle}</h1>
        <p className="auth-subtitle">{r.doneBody}</p>
        <Link href="/login" className="btn btn-primary btn-lg btn-block">
          {r.toLogin}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="auth-title">{r.newTitle}</h1>
        <p className="auth-subtitle">{r.newSubtitle}</p>
      </div>
      <form className="form" onSubmit={onSubmit} noValidate>
        {linkBroken ? (
          <FormAlert>
            {t.errors.RESET_LINK_INVALID} <Link href="/forgot-password">{r.askAgain}</Link>
          </FormAlert>
        ) : (
          formError && !fieldErrors.password && <FormAlert>{formError}</FormAlert>
        )}
        <Field
          label={r.newPassword}
          name="password"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          required
          autoFocus
          toggleLabels={{ show: t.fields.showPassword, hide: t.fields.hidePassword }}
          error={fieldErrors.password}
        />
        <Field
          label={r.confirm}
          name="confirm"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          required
          toggleLabels={{ show: t.fields.showPassword, hide: t.fields.hidePassword }}
          error={mismatch ? r.mismatch : undefined}
        />
        <SubmitButton className="btn btn-primary btn-lg btn-block" loading={pending}>
          {r.save}
        </SubmitButton>
      </form>
      <p className="auth-footer">
        <Link href="/login">{r.backToLogin}</Link>
      </p>
    </>
  );
}
