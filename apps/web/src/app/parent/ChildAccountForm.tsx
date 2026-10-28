'use client';

import { useState, type FormEvent } from 'react';
import type { Locale, UserDTO } from '@ruya/shared';
import { Field } from '@/components/Field';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

/** US-02: shown only for children aged 10 or more; the API enforces the same rule. */
export function ChildAccountForm({ locale, childId }: { locale: Locale; childId: string }) {
  const t = dictionaries[locale];
  const [created, setCreated] = useState(false);
  const { pending, formError, fieldErrors, submit } = useApiForm<UserDTO>(locale);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await submit(`/api/children/${childId}/account`, {
      email: form.get('email'),
      password: form.get('password'),
    });
    // No refresh here: it would swap this message for the "has a login" badge before it's read.
    if (result.ok) setCreated(true);
  }

  if (created) {
    return <p className="alert alert-success" role="status">{t.parent.accountCreated}</p>;
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate aria-label={t.parent.createAccountTitle}>
      <strong>{t.parent.createAccountTitle}</strong>
      {formError && <p className="alert alert-error" role="alert">{formError}</p>}
      <Field
        label={t.fields.email}
        name="email"
        type="email"
        autoComplete="off"
        dir="ltr"
        required
        error={fieldErrors.email}
      />
      <Field
        label={t.fields.password}
        name="password"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        minLength={8}
        required
        hint={t.fields.passwordHint}
        error={fieldErrors.password}
      />
      <button type="submit" className="btn btn-ghost" disabled={pending}>
        {t.parent.createAccount}
      </button>
    </form>
  );
}
