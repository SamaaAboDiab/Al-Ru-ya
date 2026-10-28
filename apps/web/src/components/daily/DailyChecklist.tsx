'use client';

import {
  Apple,
  BookOpen,
  Check,
  Croissant,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Languages,
  Moon,
  Music,
  NotebookPen,
  Palette,
  Pill,
  School,
  Soup,
  Sparkles,
  Stethoscope,
  Trophy,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import {
  DAILY_CATEGORIES,
  DAILY_ITEMS,
  type DailyCategory,
  type DailyItem,
  type DailyLogDTO,
  type Locale,
} from '@ruya/shared';
import { FormAlert } from '@/components/FormAlert';
import { apiRequest } from '@/lib/client';
import { dictionaries, formatClock } from '@/lib/i18n';

const ITEM_ICONS: Record<DailyItem, LucideIcon> = {
  breakfast: Croissant,
  lunch: UtensilsCrossed,
  dinner: Soup,
  snack: Apple,
  medicine: Pill,
  doctor: Stethoscope,
  sleep: Moon,
  school: School,
  homework: NotebookPen,
  reading: BookOpen,
  language: Languages,
  art: Palette,
  music: Music,
  training: Dumbbell,
  club: Users,
  course: GraduationCap,
};

const CATEGORY_ICONS: Record<DailyCategory, LucideIcon> = {
  meals: UtensilsCrossed,
  health: HeartPulse,
  education: GraduationCap,
  skills: Sparkles,
  club: Trophy,
};

type Props = { locale: Locale; childId: string; log: DailyLogDTO };

/** US-07/08: the day's checklist, one card per area. Tappable for the child today, read-only otherwise. */
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

      <div className="day-areas">
        {(Object.keys(DAILY_CATEGORIES) as DailyCategory[]).map((category) => {
          const items = DAILY_CATEGORIES[category] as readonly DailyItem[];
          const CategoryIcon = CATEGORY_ICONS[category];
          const areaDone = items.filter((i) => doneAt.has(i)).length;
          return (
            <section key={category} className="day-area" data-area={category} data-complete={areaDone === items.length || undefined}>
              <header className="day-area-head">
                <span className="day-area-icon">
                  <CategoryIcon size={20} aria-hidden />
                </span>
                <h3>{t.dailyCategories[category]}</h3>
                <span className="day-area-count">{t.day.categoryCount(areaDone, items.length)}</span>
              </header>

              <ul className="day-items">
                {items.map((item) => {
                  const Icon = ITEM_ICONS[item];
                  const at = doneAt.get(item);
                  const content = (
                    <>
                      <span className="day-item-icon">
                        <Icon size={18} aria-hidden />
                      </span>
                      <span className="day-item-text">
                        <span className="day-item-label">{t.dailyItems[item]}</span>
                        <span className="day-item-meta">
                          {at ? t.day.doneAt(formatClock(at, locale)) : log.editable ? t.day.notYet : t.day.notDone}
                        </span>
                      </span>
                      <span className="check-mark" aria-hidden>
                        {busyItem === item ? <span className="spinner" /> : at && <Check size={14} strokeWidth={3} />}
                      </span>
                    </>
                  );
                  return (
                    <li key={item}>
                      {log.editable ? (
                        <button
                          type="button"
                          className="day-item"
                          data-done={at ? true : undefined}
                          aria-pressed={Boolean(at)}
                          onClick={() => toggle(item)}
                          disabled={busyItem !== null}
                        >
                          {content}
                        </button>
                      ) : (
                        <div className="day-item" data-done={at ? true : undefined} data-readonly>
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
