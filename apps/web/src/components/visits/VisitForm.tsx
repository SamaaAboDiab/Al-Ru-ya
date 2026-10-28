'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { todayIn, type Locale, type ParentSummary, type VisitDTO } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SelectField } from '@/components/SelectField';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

type Props = {
  locale: Locale;
  childId: string;
  parents: ParentSummary[];
  /** Edit this visit; omit to log a new one. */
  visit?: VisitDTO;
  onDone: () => void;
};

/** US-09: the child logs (or, on the same day, edits) a visit. */
export function VisitForm({ locale, childId, parents, visit, onDone }: Props) {
  const t = dictionaries[locale];
  const v = t.visits;
  const router = useRouter();
  const { pending, formError, fieldErrors, submit } = useApiForm<VisitDTO>(locale);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      parentId: form.get('parentId') || '',
      date: form.get('date'),
      startTime: form.get('startTime'),
      endTime: form.get('endTime') || '',
    };
    const base = `/api/children/${childId}/visits`;
    const result = visit ? await submit(`${base}/${visit.id}`, body, 'PUT') : await submit(base, body);
    if (result.ok) {
      onDone();
      router.push(`/child/visits/${result.data.id}`);
      router.refresh();
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {formError && <FormAlert>{formError}</FormAlert>}
      <SelectField
        label={v.withWhom}
        name="parentId"
        required
        placeholder={v.choose}
        defaultValue={visit?.parent.id ?? (parents.length === 1 ? parents[0].id : '')}
        options={parents.map((p) => ({ value: p.id, label: `${p.name} (${t.fields[p.role]})` }))}
        error={fieldErrors.parentId}
      />
      <Field
        label={v.date}
        name="date"
        type="date"
        required
        defaultValue={visit?.date ?? todayIn()}
        error={fieldErrors.date}
      />
      <div className="field-row">
        <Field label={v.from} name="startTime" type="time" required defaultValue={visit?.startTime} error={fieldErrors.startTime} />
        <Field label={v.to} name="endTime" type="time" defaultValue={visit?.endTime} error={fieldErrors.endTime} />
      </div>
      <SubmitButton className="btn btn-primary btn-block" loading={pending}>
        {visit ? v.save : v.log}
      </SubmitButton>
    </form>
  );
}
