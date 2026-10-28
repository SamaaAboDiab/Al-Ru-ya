'use client';

import { CalendarDays, ChevronDown, CircleAlert, Clock, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { Locale } from '@ruya/shared';
import { dictionaries, formatDate, formatTime } from '@/lib/i18n';
import { CalendarPanel } from './pickers/CalendarPanel';
import { TimePanel } from './pickers/TimePanel';

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
 * Date and time fields drawn entirely in the app's style, in the page language and direction.
 * The picker opens inline under the field (never clipped inside dialogs), and a hidden input
 * carries the value ("YYYY-MM-DD" or "HH:MM") into the form.
 */
export function PickerField({ locale, type, label, name, defaultValue, min, max, required, hint, error }: Props) {
  const t = dictionaries[locale].fields;
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const Icon = type === 'date' ? CalendarDays : Clock;
  const shown = value ? (type === 'date' ? formatDate(value, locale) : formatTime(value, locale)) : null;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  // Close on Escape or a click outside the field.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointer);
    root.current?.addEventListener('keydown', onKey);
    const el = root.current;
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      el?.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="field" ref={root}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="field-control picker">
        <button
          type="button"
          id={id}
          className="picker-button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        >
          <Icon size={18} aria-hidden className="picker-icon" />
          <span className={shown ? 'picker-value' : 'picker-placeholder'}>
            {shown ?? (type === 'date' ? t.chooseDate : t.chooseTime)}
          </span>
          <ChevronDown size={18} aria-hidden className="picker-caret" />
        </button>
        {!required && value && !open && (
          <button type="button" className="picker-clear" onClick={() => setValue('')} aria-label={t.clear} title={t.clear}>
            <X size={16} aria-hidden />
          </button>
        )}
        <input type="hidden" name={name} value={value} />
      </div>

      {open &&
        (type === 'date' ? (
          <CalendarPanel
            locale={locale}
            value={value}
            min={min}
            max={max}
            clearable={!required}
            onPick={(v) => {
              setValue(v);
              setOpen(false);
            }}
          />
        ) : (
          <TimePanel
            locale={locale}
            value={value}
            clearable={!required}
            onPick={(v, close) => {
              setValue(v);
              if (close) setOpen(false);
            }}
          />
        ))}

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
