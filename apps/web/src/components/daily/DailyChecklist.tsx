'use client';

import {
  BookOpen,
  Check,
  Croissant,
  Dumbbell,
  NotebookPen,
  School,
  Soup,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { DAILY_ITEMS, type DailyItem, type DailyLogDTO, type Locale } from '@ruya/shared';
import { FormAlert } from '@/components/FormAlert';
import { apiRequest } from '@/lib/client';
import { dictionaries, formatClock } from '@/lib/i18n';

const ICONS: Record<DailyItem, LucideIcon> = {
  school: School,
  breakfast: Croissant,
  lunch: UtensilsCrossed,
  dinner: Soup,
  homework: NotebookPen,
  training: Dumbbell,
  reading: BookOpen,
};

type Props = { locale: Locale; childId: string; log: DailyLogDTO };

/** US-07/08: the day's checklist. Tappable for the child today, read-only otherwise. */
export function DailyChecklist({ locale, childId, log: initial }: Props) {
  const t = dictionaries[locale];
  const [log, setLog] = useState(initial);
  const [busyItem, setBusyItem] = useState<DailyItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doneAt = new Map(log.entries.map((e) => [e.item, e.doneAt]));
  const done = log.entries.length;
  const total = DAILY_ITEMS.length;

  async function toggle(item: DailyItem) {
    if (!log.editable || busyItem) return;
    const items = doneAt.has(item)
      ? log.entries.map((e) => e.item).filter((i) => i !== item)
      : [...log.entries.map((e) => e.item), item];
    setBusyItem(item);
    setError(null);
    const result = await apiRequest<DailyLogDTO>('PUT', `/api/children/${childId}/daily-logs/${log.date}`, { items });
    setBusyItem(null);
    if (result.ok) setLog(result.data);
    else setError(t.errors[result.code as keyof typeof t.errors] ?? t.errors.INTERNAL);
  }

  return (
    <div className="stack">
      <div className="day-progress" aria-live="polite">
        <div className="day-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <span style={{ inlineSize: `${(done / total) * 100}%` }} />
        </div>
        <strong>{t.day.progress(done, total)}</strong>
      </div>

      {error && <FormAlert>{error}</FormAlert>}
      {log.editable ? (
        <p className="muted day-hint">{t.day.tapHint}</p>
      ) : (
        done === 0 && <p className="muted day-hint">{t.day.emptyDay}</p>
      )}

      <ul className="check-grid">
        {DAILY_ITEMS.map((item) => {
          const Icon = ICONS[item];
          const at = doneAt.get(item);
          const content = (
            <>
              <span className="check-icon">
                <Icon size={22} aria-hidden />
              </span>
              <span className="check-text">
                <span className="check-label">{t.dailyItems[item]}</span>
                <span className="check-meta">
                  {at ? t.day.doneAt(formatClock(at, locale)) : log.editable ? t.day.notYet : t.day.notDone}
                </span>
              </span>
              <span className="check-mark" aria-hidden>
                {busyItem === item ? <span className="spinner" /> : at && <Check size={16} strokeWidth={3} />}
              </span>
            </>
          );
          return (
            <li key={item}>
              {log.editable ? (
                <button
                  type="button"
                  className="check-tile"
                  data-done={at ? true : undefined}
                  aria-pressed={Boolean(at)}
                  onClick={() => toggle(item)}
                  disabled={busyItem !== null}
                >
                  {content}
                </button>
              ) : (
                <div className="check-tile" data-done={at ? true : undefined} data-readonly>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
