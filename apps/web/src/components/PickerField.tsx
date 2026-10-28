'use client';

import { CalendarDays, CircleAlert, Clock, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { Locale } from '@ruya/shared';
import { dictionaries, formatDate, formatTime } from '@/lib/i18n';

type Props = {
  locale: Locale;
  type: 'date' | 'time';
  label: string;
  name: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

/**
 * Date and time fields drawn in the app's style. Native date/time inputs render their
 * placeholder segments reversed in right-to-left pages and can't be styled, so the value
 * is shown formatted for the language, and tapping opens the browser's own picker.
 * The hidden native input still carries the value into the form.
 */
export function PickerField({ locale, type, label, name, defaultValue, min, max, required, hint, error }: Props) {
  const t = dictionaries[locale].fields;
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue ?? '');
  const Icon = type === 'date' ? CalendarDays : Clock;
  const shown = value ? (type === 'date' ? formatDate(value, locale) : formatTime(value, locale)) : null;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  function open() {
    const el = input.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      // Older browsers without showPicker: focusing the input still lets people type a value.
      el.focus();
    }
  }

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="field-control picker">
        <button
          type="button"
          id={id}
          className="picker-button"
          onClick={open}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        >
          <Icon size={18} aria-hidden className="picker-icon" />
          <span className={shown ? 'picker-value' : 'picker-placeholder'}>
            {shown ?? (type === 'date' ? t.chooseDate : t.chooseTime)}
          </span>
        </button>
        {!required && value && (
          <button type="button" className="picker-clear" onClick={() => setValue('')} aria-label={t.clear} title={t.clear}>
            <X size={16} aria-hidden />
          </button>
        )}
        <input
          ref={input}
          className="picker-native"
          type={type}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min={min}
          max={max}
          required={required}
          tabIndex={-1}
          aria-hidden
        />
      </div>
      {error ? (
        <span id={`${id}-error`} className="field-error">
          <CircleAlert size={14} aria-hidden />
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="field-hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
