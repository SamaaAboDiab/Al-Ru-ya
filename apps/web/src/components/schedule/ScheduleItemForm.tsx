'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { SCHEDULE_DAYS, type Locale, type ScheduleDay, type ScheduleItemDTO } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SelectField } from '@/components/SelectField';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

type Props = {
  locale: Locale;
  childId: string;
  /** Edit this item; omit to add a new one. */
  item?: ScheduleItemDTO;
  defaultDay?: ScheduleDay;
  onDone: () => void;
};

/** US-06: add or edit one weekly activity. */
export function ScheduleItemForm({ locale, childId, item, defaultDay, onDone }: Props) {
  const t = dictionaries[locale];
  const s = t.schedule;
  const router = useRouter();
  const { pending, formError, fieldErrors, submit } = useApiForm<ScheduleItemDTO>(locale);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      activity: form.get('activity'),
      day: form.get('day') || undefined,
      startTime: form.get('startTime'),
      endTime: form.get('endTime'),
      location: form.get('location') || undefined,
    };
    const base = `/api/children/${childId}/schedule`;
    const result = item ? await submit(`${base}/${item.id}`, body, 'PUT') : await submit(base, body);
    if (result.ok) {
      onDone();
      router.refresh();
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field
        label={s.activity}
        name="activity"
        placeholder={s.activityPlaceholder}
        maxLength={60}
        required
        autoFocus
        defaultValue={item?.activity}
        error={fieldErrors.activity}
      />
      <SelectField
        label={s.day}
        name="day"
        required
        placeholder={s.chooseDay}
        defaultValue={item?.day ?? defaultDay ?? ''}
        options={SCHEDULE_DAYS.map((d) => ({ value: d, label: t.days[d] }))}
        error={fieldErrors.day}
      />
      <div className="field-row">
        <Field
          label={s.start}
          name="startTime"
          type="time"
          required
          defaultValue={item?.startTime}
          error={fieldErrors.startTime}
        />
        <Field
          label={s.end}
          name="endTime"
          type="time"
          required
          defaultValue={item?.endTime}
          error={fieldErrors.endTime}
        />
      </div>
      <Field
        label={s.location}
        name="location"
        placeholder={s.locationPlaceholder}
        maxLength={80}
        defaultValue={item?.location}
        error={fieldErrors.location}
      />
      <SubmitButton className="btn btn-primary btn-block" loading={pending}>
        {item ? s.save : s.add}
      </SubmitButton>
    </form>
  );
}
