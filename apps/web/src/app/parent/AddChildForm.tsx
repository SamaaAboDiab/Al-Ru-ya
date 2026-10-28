'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import type { ChildDTO, Locale } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

export function AddChildForm({ locale, onDone }: { locale: Locale; onDone: () => void }) {
  const t = dictionaries[locale];
  const router = useRouter();
  const { pending, formError, fieldErrors, submit } = useApiForm<ChildDTO>(locale);
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await submit('/api/children', {
      name: form.get('name'),
      birthDate: form.get('birthDate'),
    });
    if (result.ok) {
      onDone();
      router.refresh();
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label={t.fields.childName} name="name" required autoFocus error={fieldErrors.name} />
      <Field
        label={t.fields.birthDate}
        name="birthDate"
        type="date"
        max={today}
        required
        error={fieldErrors.birthDate}
      />
      <SubmitButton className="btn btn-primary btn-block" loading={pending}>
        {t.parent.addChild}
      </SubmitButton>
    </form>
  );
}
