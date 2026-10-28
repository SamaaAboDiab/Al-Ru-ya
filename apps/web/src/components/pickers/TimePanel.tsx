'use client';

import { useState } from 'react';
import type { Locale } from '@ruya/shared';
import { dictionaries, formatNumber } from '@/lib/i18n';

type Props = {
  locale: Locale;
  value: string;
  clearable: boolean;
  onPick: (value: string, close: boolean) => void;
};

const MINUTES = [0, 15, 30, 45];
const pad = (n: number) => String(n).padStart(2, '0');

/** Hour, minute and AM/PM as taps instead of the browser's spinner. Value is "HH:MM", 24-hour. */
export function TimePanel({ locale, value, clearable, onPick }: Props) {
  const t = dictionaries[locale].fields;
  const [h24, m] = value ? value.split(':').map(Number) : [16, 0];
  const [hour, setHour] = useState(h24 % 12 || 12);
  const [minute, setMinute] = useState(MINUTES.includes(m) ? m : m - (m % 15));
  const [pm, setPm] = useState(h24 >= 12);

  const toValue = (h: number, min: number, isPm: boolean) => `${pad((h % 12) + (isPm ? 12 : 0))}:${pad(min)}`;

  // Each tap updates the field right away; "Done" just closes the panel.
  function update(next: { hour?: number; minute?: number; pm?: boolean }) {
    const h = next.hour ?? hour;
    const min = next.minute ?? minute;
    const p = next.pm ?? pm;
    setHour(h);
    setMinute(min);
    setPm(p);
    onPick(toValue(h, min, p), false);
  }

  return (
    <div className="time-panel" role="group" aria-label={t.chooseTime}>
      <div className="time-section">
        <span className="time-label">{t.hour}</span>
        <div className="time-hours">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <button
              key={h}
              type="button"
              className="time-chip"
              aria-pressed={value !== '' && h === hour}
              onClick={() => update({ hour: h })}
            >
              {formatNumber(h, locale)}
            </button>
          ))}
        </div>
      </div>

      <div className="time-row">
        <div className="time-section">
          <span className="time-label">{t.minute}</span>
          <div className="time-minutes">
            {MINUTES.map((min) => (
              <button
                key={min}
                type="button"
                className="time-chip"
                aria-pressed={value !== '' && min === minute}
                onClick={() => update({ minute: min })}
              >
                {formatNumber(min, locale).padStart(2, formatNumber(0, locale))}
              </button>
            ))}
          </div>
        </div>
        <div className="time-period" role="group">
          <button type="button" className="time-chip" aria-pressed={value !== '' && !pm} onClick={() => update({ pm: false })}>
            {t.am}
          </button>
          <button type="button" className="time-chip" aria-pressed={value !== '' && pm} onClick={() => update({ pm: true })}>
            {t.pm}
          </button>
        </div>
      </div>

      <div className="picker-foot">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onPick(value || toValue(hour, minute, pm), true)}
        >
          {t.done}
        </button>
        {clearable && value && (
          <button type="button" className="picker-link picker-link-muted" onClick={() => onPick('', true)}>
            {t.clear}
          </button>
        )}
      </div>
    </div>
  );
}
