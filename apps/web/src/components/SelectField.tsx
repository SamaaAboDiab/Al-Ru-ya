'use client';

import { ChevronDown, CircleAlert } from 'lucide-react';
import { useId, type SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  error?: string;
};

export function SelectField({ label, placeholder, options, error, ...select }: Props) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="field-control field-select">
        <select id={id} aria-invalid={error ? true : undefined} aria-describedby={errorId} {...select}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} aria-hidden className="field-select-icon" />
      </div>
      {error && (
        <span id={errorId} className="field-error">
          <CircleAlert size={14} aria-hidden />
          {error}
        </span>
      )}
    </div>
  );
}
