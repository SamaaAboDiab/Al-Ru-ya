'use client';

import { CalendarPlus, Pencil, Plus } from 'lucide-react';
import type { Locale, ParentSummary, VisitDTO } from '@ruya/shared';
import { Dialog } from '@/components/Dialog';
import { dictionaries } from '@/lib/i18n';
import { VisitForm } from './VisitForm';

type Common = { locale: Locale; childId: string; parents: ParentSummary[] };

export function LogVisitDialog({ locale, childId, parents }: Common) {
  const t = dictionaries[locale];
  return (
    <Dialog
      title={t.visits.logTitle}
      description={t.visits.logDesc}
      icon={<CalendarPlus size={22} aria-hidden />}
      closeLabel={t.close}
      trigger={(open) => (
        <button type="button" className="btn btn-primary" onClick={open}>
          <Plus size={18} aria-hidden />
          {t.visits.log}
        </button>
      )}
    >
      {(close) => <VisitForm locale={locale} childId={childId} parents={parents} onDone={close} />}
    </Dialog>
  );
}

export function EditVisitDialog({ locale, childId, parents, visit }: Common & { visit: VisitDTO }) {
  const t = dictionaries[locale];
  return (
    <Dialog
      title={t.visits.editTitle}
      icon={<Pencil size={20} aria-hidden />}
      closeLabel={t.close}
      trigger={(open) => (
        <button type="button" className="btn btn-secondary" onClick={open}>
          <Pencil size={16} aria-hidden />
          {t.visits.edit}
        </button>
      )}
    >
      {(close) => <VisitForm locale={locale} childId={childId} parents={parents} visit={visit} onDone={close} />}
    </Dialog>
  );
}
