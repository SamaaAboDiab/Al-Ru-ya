'use client';

import { Plus, UserPlus } from 'lucide-react';
import type { Locale } from '@ruya/shared';
import { Dialog } from '@/components/Dialog';
import { dictionaries } from '@/lib/i18n';
import { AddChildForm } from './AddChildForm';

export function AddChildDialog({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  return (
    <Dialog
      title={t.parent.addChild}
      description={t.parent.addChildDesc}
      icon={<UserPlus size={22} aria-hidden />}
      closeLabel={t.close}
      trigger={(open) => (
        <button type="button" className="btn btn-primary" onClick={open}>
          <Plus size={18} aria-hidden />
          {t.parent.addChild}
        </button>
      )}
    >
      {(close) => <AddChildForm locale={locale} onDone={close} />}
    </Dialog>
  );
}
