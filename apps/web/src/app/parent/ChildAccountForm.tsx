'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { Locale, UserDTO } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

/** US-02: offered only for children aged 10 or more; the API enforces the same rule. */
export function ChildAccountForm({ locale, childId, onDone }: { locale: Locale; childId: string; onDone: () => void }) {
  const t = dictionaries[locale];
  const router = useRouter();
  const [created, setCreated] = useState(false);
  const { pending, formError, fieldErrors, submit } = useApiForm<UserDTO>(locale);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await submit(`/api/children/${childId}/account`, {
      email: form.get('email'),
      password: form.get('password'),
    });
    if (result.ok) setCreated(true);
  }

  function finish() {
    onDone();
    router.refresh();
  }

  if (created) {
    return (
      <div className="stack">
        <FormAlert tone="success">{t.parent.accountCreated}</FormAlert>
        <button type="button" className="btn btn-primary btn-block" onClick={finish}>
          {t.parent.done}
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field
        label={t.fields.email}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="off"
        dir="ltr"
        required
        autoFocus
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
        toggleLabels={{ show: t.fields.showPassword, hide: t.fields.hidePassword }}
        error={fieldErrors.password}
      />
      <SubmitButton className="btn btn-primary btn-block" loading={pending}>
        {t.parent.createAccount}
      </SubmitButton>
    </form>
  );
}
