'use client';

import { CalendarX, CircleCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { CANCEL_NOTE_MAX, CANCEL_REASONS, todayIn, type Locale, type VisitDTO } from '@ruya/shared';
import { Dialog } from '@/components/Dialog';
import { Field } from '@/components/Field';
import { PickerField } from '@/components/PickerField';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

/** US-10: shown only to the parent the visit is with, once it has started. */
export function ConfirmVisitButton({ locale, childId, visitId }: { locale: Locale; childId: string; visitId: string }) {
  const t = dictionaries[locale];
  const router = useRouter();
  const { pending, formError, submit } = useApiForm<VisitDTO>(locale);

  async function confirm() {
    const result = await submit(`/api/children/${childId}/visits/${visitId}/confirm`);
    if (result.ok) router.refresh();
  }

  return (
    <div className="stack">
      {formError && <FormAlert>{formError}</FormAlert>}
      <SubmitButton type="button" className="btn btn-primary btn-lg btn-block" loading={pending} onClick={confirm}>
        <CircleCheck size={20} aria-hidden />
        {t.visits.confirm}
      </SubmitButton>
      <p className="muted field-hint">{t.visits.confirmHint}</p>
    </div>
  );
}

type CancelProps = {
  locale: Locale;
  childId: string;
  /** Cancel this visit; omit to report "can't visit" for a new date. */
  visitId?: string;
  onDone: () => void;
};

/** US-11: reason from the list, or a short note (required for "other"). One-way notice, no replies. */
function CantVisitForm({ locale, childId, visitId, onDone }: CancelProps) {
  const t = dictionaries[locale];
  const v = t.visits;
  const router = useRouter();
  const { pending, formError, fieldErrors, submit } = useApiForm<VisitDTO>(locale);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const reason = { reasonCode: form.get('reasonCode') || undefined, note: form.get('note') || undefined };
    const base = `/api/children/${childId}/visits`;
    const result = visitId
      ? await submit(`${base}/${visitId}/cancel`, reason)
      : await submit(`${base}/cant-visit`, { ...reason, date: form.get('date'), startTime: form.get('startTime') });
    if (result.ok) {
      onDone();
      if (!visitId) router.push(`/parent/children/${childId}/visits/${result.data.id}`);
      router.refresh();
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {formError && <FormAlert>{formError}</FormAlert>}
      {!visitId && (
        <div className="field-row">
          <PickerField locale={locale} label={v.date} name="date" type="date" required min={todayIn()} defaultValue={todayIn()} error={fieldErrors.date} />
          <PickerField locale={locale} label={v.from} name="startTime" type="time" required error={fieldErrors.startTime} />
        </div>
      )}
      <fieldset className="choice-group" aria-describedby={fieldErrors.reasonCode ? 'reason-error' : undefined}>
        <legend className="field-label">{v.reasonLabel}</legend>
        <div className="reason-options">
          {CANCEL_REASONS.map((code) => (
            <label key={code} className="choice choice-sm">
              <input type="radio" name="reasonCode" value={code} />
              {v.reasons[code]}
            </label>
          ))}
        </div>
        {fieldErrors.reasonCode && (
          <span id="reason-error" className="field-error">
            {fieldErrors.reasonCode}
          </span>
        )}
      </fieldset>
      <Field
        label={v.noteLabel}
        name="note"
        placeholder={v.notePlaceholder}
        maxLength={CANCEL_NOTE_MAX}
        error={fieldErrors.note}
      />
      <SubmitButton className="btn btn-danger btn-block" loading={pending}>
        {v.send}
      </SubmitButton>
    </form>
  );
}

export function CantVisitDialog({
  locale,
  childId,
  visitId,
  variant = 'secondary',
}: {
  locale: Locale;
  childId: string;
  visitId?: string;
  variant?: 'secondary' | 'block';
}) {
  const t = dictionaries[locale];
  return (
    <Dialog
      title={t.visits.cantVisitTitle}
      description={t.visits.cantVisitDesc}
      icon={<CalendarX size={22} aria-hidden />}
      closeLabel={t.close}
      trigger={(open) => (
        <button
          type="button"
          className={variant === 'block' ? 'btn btn-secondary btn-lg btn-block btn-danger-text' : 'btn btn-secondary btn-danger-text'}
          onClick={open}
        >
          <CalendarX size={18} aria-hidden />
          {t.visits.cantVisit}
        </button>
      )}
    >
      {(close) => <CantVisitForm locale={locale} childId={childId} visitId={visitId} onDone={close} />}
    </Dialog>
  );
}
