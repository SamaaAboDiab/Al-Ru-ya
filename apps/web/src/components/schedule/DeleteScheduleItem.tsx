'use client';

import { useRouter } from 'next/navigation';
import type { Locale, ScheduleItemDTO } from '@ruya/shared';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

export function DeleteScheduleItem({
  locale,
  childId,
  item,
  onDone,
}: {
  locale: Locale;
  childId: string;
  item: ScheduleItemDTO;
  onDone: () => void;
}) {
  const s = dictionaries[locale].schedule;
  const router = useRouter();
  const { pending, formError, submit } = useApiForm<void>(locale);

  async function confirm() {
    const result = await submit(`/api/children/${childId}/schedule/${item.id}`, undefined, 'DELETE');
    if (result.ok) {
      onDone();
      router.refresh();
    }
  }

  return (
    <div className="stack">
      {formError && <FormAlert>{formError}</FormAlert>}
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onDone} disabled={pending}>
          {s.cancel}
        </button>
        <SubmitButton type="button" className="btn btn-danger" loading={pending} onClick={confirm}>
          {s.confirmDelete}
        </SubmitButton>
      </div>
    </div>
  );
}
