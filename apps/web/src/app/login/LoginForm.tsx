'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type FormEvent } from 'react';
import type { Locale, UserDTO } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { useApiForm } from '@/lib/useApiForm';

type Props = { locale: Locale; next?: string; email?: string };

export function LoginForm({ locale, next, email }: Props) {
  const t = dictionaries[locale];
  const router = useRouter();
  const { pending, formError, fieldErrors, submit } = useApiForm<UserDTO>(locale);
  const form = useRef<HTMLFormElement>(null);

  /** Carries whatever email is typed so far, so it needn't be typed again. */
  function forgotHref() {
    const typed = form.current?.email?.value?.trim() || email;
    return typed ? `/forgot-password?email=${encodeURIComponent(typed)}` : '/forgot-password';
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await submit('/api/auth/login', {
      email: form.get('email'),
      password: form.get('password'),
    });
    if (result.ok) {
      router.replace(next ?? homeFor(result.data.role));
      router.refresh();
    }
  }

  return (
    <form ref={form} className="form" onSubmit={onSubmit} noValidate>
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
        defaultValue={email}
        error={fieldErrors.email}
      />
      <Field
        label={t.fields.password}
        name="password"
        type="password"
        autoComplete="current-password"
        dir="ltr"
        required
        toggleLabels={{ show: t.fields.showPassword, hide: t.fields.hidePassword }}
        error={fieldErrors.password}
      />
      <Link
        href="/forgot-password"
        className="auth-forgot"
        onClick={(e) => {
          e.preventDefault();
          router.push(forgotHref());
        }}
      >
        {t.login.forgot}
      </Link>
      <SubmitButton className="btn btn-primary btn-lg btn-block" loading={pending}>
        {t.login.submit}
      </SubmitButton>
    </form>
  );
}
