'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { formatEgyptMobile, type Locale, type SignupDraftDTO, type UserDTO } from '@ruya/shared';
import { roleOptions } from '@/components/auth/roleOptions';
import { ChoiceField } from '@/components/ChoiceField';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { useApiForm } from '@/lib/useApiForm';

type Props = { locale: Locale; draft: SignupDraftDTO; next?: string };

export function CompleteForm({ locale, draft, next }: Props) {
  const t = dictionaries[locale];
  const router = useRouter();
  const { pending, formError, fieldErrors, submit } = useApiForm<UserDTO>(locale);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await submit('/api/auth/signup', {
      name: form.get('name'),
      role: form.get('role') ?? undefined,
      // A proven email can't be changed, so it isn't sent at all.
      ...(draft.emailVerified ? {} : { email: form.get('email') }),
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
      {draft.phone && (
        <p className="phone-sent">
          {t.phone.yourNumber}:{' '}
          <bdi dir="ltr" className="phone-number">
            {formatEgyptMobile(draft.phone)}
          </bdi>
        </p>
      )}
      <ChoiceField label={t.fields.role} name="role" required options={roleOptions(t)} error={fieldErrors.role} />
      <Field
        label={t.fields.name}
        name="name"
        autoComplete="name"
        placeholder={t.fields.namePlaceholder}
        required
        defaultValue={draft.name}
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
        readOnly={draft.emailVerified}
        defaultValue={draft.email}
        hint={draft.emailVerified ? t.signin.emailVerified : undefined}
        error={fieldErrors.email}
      />
      <SubmitButton className="btn btn-primary btn-lg btn-block" loading={pending}>
        {t.signin.completeSubmit}
      </SubmitButton>
    </form>
  );
}
