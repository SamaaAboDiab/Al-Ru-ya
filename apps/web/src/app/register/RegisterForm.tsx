'use client';

import { CircleAlert, User, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { ROLES, PARENT_ROLES, type Locale, type UserDTO } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { useApiForm } from '@/lib/useApiForm';

type Props = { locale: Locale; next?: string; email?: string };

export function RegisterForm({ locale, next, email }: Props) {
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
      router.replace(next ?? homeFor(result.data.role));
      router.refresh();
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {formError && <FormAlert>{formError}</FormAlert>}
      <fieldset className="choice-group" aria-describedby={fieldErrors.role ? 'role-error' : undefined}>
        <legend className="field-label">{t.fields.role}</legend>
        <div className="choice-options">
          {PARENT_ROLES.map((role) => {
            const Icon = role === ROLES.MOTHER ? UserRound : User;
            return (
              <label key={role} className="choice">
                <input type="radio" name="role" value={role} required />
                <span className="choice-icon">
                  <Icon size={18} aria-hidden />
                </span>
                {t.fields[role]}
              </label>
            );
          })}
        </div>
        {fieldErrors.role && (
          <span id="role-error" className="field-error">
            <CircleAlert size={14} aria-hidden />
            {fieldErrors.role}
          </span>
        )}
      </fieldset>
      <Field
        label={t.fields.name}
        name="name"
        autoComplete="name"
        placeholder={t.fields.namePlaceholder}
        required
        error={fieldErrors.name}
      />
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
        autoComplete="new-password"
        dir="ltr"
        minLength={8}
        required
        hint={t.fields.passwordHint}
        toggleLabels={{ show: t.fields.showPassword, hide: t.fields.hidePassword }}
        error={fieldErrors.password}
      />
      <SubmitButton className="btn btn-primary btn-lg btn-block" loading={pending}>
        {t.register.submit}
      </SubmitButton>
    </form>
  );
}
