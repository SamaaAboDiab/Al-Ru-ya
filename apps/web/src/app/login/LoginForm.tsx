'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import type { Locale, UserDTO } from '@ruya/shared';
import { Field } from '@/components/Field';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { useApiForm } from '@/lib/useApiForm';

export function LoginForm({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const router = useRouter();
  const { pending, formError, fieldErrors, submit } = useApiForm<UserDTO>(locale);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await submit('/api/auth/login', {
      email: form.get('email'),
      password: form.get('password'),
    });
    if (result.ok) {
      router.replace(homeFor(result.data.role));
      router.refresh();
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {formError && <p className="alert alert-error" role="alert">{formError}</p>}
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
        autoComplete="current-password"
        dir="ltr"
        required
        error={fieldErrors.password}
      />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {t.login.submit}
      </button>
    </form>
  );
}
