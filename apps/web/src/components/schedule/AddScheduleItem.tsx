'use client';

import { CalendarPlus, Plus } from 'lucide-react';
import type { Locale } from '@ruya/shared';
import { Dialog } from '@/components/Dialog';
import { dictionaries } from '@/lib/i18n';
import { ScheduleItemForm } from './ScheduleItemForm';

export function AddScheduleItem({ locale, childId }: { locale: Locale; childId: string }) {
  const t = dictionaries[locale];
  return (
    <Dialog
      title={t.schedule.addTitle}
      description={t.schedule.formDesc}
      icon={<CalendarPlus size={22} aria-hidden />}
      closeLabel={t.close}
      trigger={(open) => (
        <button type="button" className="btn btn-primary" onClick={open}>
          <Plus size={18} aria-hidden />
          {t.schedule.add}
        </button>
      )}
    >
      {(close) => <ScheduleItemForm locale={locale} childId={childId} onDone={close} />}
    </Dialog>
  );
}
