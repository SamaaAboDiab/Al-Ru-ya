'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import type { ChildDTO, Locale } from '@ruya/shared';
import { Field } from '@/components/Field';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

export function AddChildForm({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const router = useRouter();
  const { pending, formError, fieldErrors, submit } = useApiForm<ChildDTO>(locale);
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const result = await submit('/api/children', {
      name: form.get('name'),
      birthDate: form.get('birthDate'),
    });
    if (result.ok) {
      formEl.reset();
      router.refresh();
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {formError && <p className="alert alert-error" role="alert">{formError}</p>}
      <Field label={t.fields.childName} name="name" dir="auto" required error={fieldErrors.name} />
      <Field
        label={t.fields.birthDate}
        name="birthDate"
        type="date"
        max={today}
        required
        error={fieldErrors.birthDate}
      />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {t.parent.addChild}
      </button>
    </form>
  );
}
