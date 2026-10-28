'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { PARENT_ROLES, type Locale, type UserDTO } from '@ruya/shared';
import { Field } from '@/components/Field';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { useApiForm } from '@/lib/useApiForm';

export function RegisterForm({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const router = useRouter();
  const { pending, formError, fieldErrors, submit } = useApiForm<UserDTO>(locale);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await submit('/api/auth/register', {
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
      role: form.get('role') ?? undefined,
      locale,
    });
    if (result.ok) {
      router.replace(homeFor(result.data.role));
      router.refresh();
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {formError && <p className="alert alert-error" role="alert">{formError}</p>}
      <fieldset className="field segmented" aria-describedby={fieldErrors.role ? 'role-error' : undefined}>
        <legend>{t.fields.role}</legend>
        <div className="segmented-options">
          {PARENT_ROLES.map((role) => (
            <label key={role}>
              <input type="radio" name="role" value={role} required />
              {t.fields[role]}
            </label>
          ))}
        </div>
        {fieldErrors.role && (
          <span id="role-error" className="error">
            {fieldErrors.role}
          </span>
        )}
      </fieldset>
      <Field label={t.fields.name} name="name" autoComplete="name" dir="auto" required error={fieldErrors.name} />
      <Field
        label={t.fields.email}
        name="email"
        type="email"
        autoComplete="email"
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
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {t.register.submit}
      </button>
    </form>
  );
}
