'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { todayIn, type Locale } from '@ruya/shared';
import { dictionaries, formatNumber } from '@/lib/i18n';

type Props = {
  locale: Locale;
  value: string;
  min?: string;
  max?: string;
  clearable: boolean;
  onPick: (value: string) => void;
};

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Month grid in the app's style. Weeks start on Saturday, as in Egypt and the schedule. */
export function CalendarPanel({ locale, value, min, max, clearable, onPick }: Props) {
  const t = dictionaries[locale].fields;
  const tag = locale === 'ar' ? 'ar-EG' : 'en-GB';
  const today = todayIn();
  const start = value || (max && max < today ? max : today);
  const [view, setView] = useState({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 });

  const minYear = min ? Number(min.slice(0, 4)) : Number(today.slice(0, 4)) - 100;
  const maxYear = max ? Number(max.slice(0, 4)) : Number(today.slice(0, 4)) + 5;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const monthName = (m: number, style: 'long') =>
    new Intl.DateTimeFormat(tag, { month: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2000, m, 1)));
  // 2000-01-01 was a Saturday, so the first seven days give the week's names in order.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(tag, { weekday: locale === 'ar' ? 'narrow' : 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2000, 0, 1 + i)),
    ),
  );

  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(view.y, view.m, 1)).getUTCDay() + 1) % 7; // Saturday-first
  const inRange = (d: string) => (!min || d >= min) && (!max || d <= max);

  function shift(delta: number) {
    setView(({ y, m }) => {
      const next = m + delta;
      return { y: y + Math.floor(next / 12), m: ((next % 12) + 12) % 12 };
    });
  }

  return (
    <div className="calendar" role="group" aria-label={t.chooseDate}>
      <div className="calendar-head">
        <button type="button" className="icon-btn icon-btn-sm" onClick={() => shift(-1)} aria-label={t.prevMonth}>
          <ChevronLeft size={18} aria-hidden className="rtl-flip" />
        </button>
        <div className="calendar-selects">
          <select
            aria-label={t.month}
            value={view.m}
            onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))}
          >
            {Array.from({ length: 12 }, (_, m) => (
              <option key={m} value={m}>
                {monthName(m, 'long')}
              </option>
            ))}
          </select>
          <select
            aria-label={t.year}
            value={view.y}
            onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {formatNumber(y, locale).replace(/[٬,]/g, '')}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="icon-btn icon-btn-sm" onClick={() => shift(1)} aria-label={t.nextMonth}>
          <ChevronRight size={18} aria-hidden className="rtl-flip" />
        </button>
      </div>

      <div className="calendar-grid" role="grid">
        {weekdays.map((w) => (
          <span key={w} className="calendar-weekday" role="columnheader">
            {w}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = iso(view.y, view.m, i + 1);
          const enabled = inRange(day);
          return (
            <button
              key={day}
              type="button"
              className="calendar-day"
              data-today={day === today || undefined}
              aria-pressed={day === value}
              disabled={!enabled}
              onClick={() => onPick(day)}
            >
              {formatNumber(i + 1, locale)}
            </button>
          );
        })}
      </div>

      <div className="picker-foot">
        {inRange(today) ? (
          <button type="button" className="picker-link" onClick={() => onPick(today)}>
            {t.today}
          </button>
        ) : (
          <span />
        )}
        {clearable && value && (
          <button type="button" className="picker-link picker-link-muted" onClick={() => onPick('')}>
            {t.clear}
          </button>
        )}
      </div>
    </div>
  );
}
