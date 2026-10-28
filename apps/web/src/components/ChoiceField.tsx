'use client';

import { Check, CircleAlert } from 'lucide-react';
import { useId, type ReactNode } from 'react';

type Option = { value: string; label: string; hint?: string; media?: ReactNode };

type Props = {
  label: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  required?: boolean;
  error?: string;
  /** `cards` for a few rich choices (a person), `chips` for many short ones (a weekday). */
  variant?: 'cards' | 'chips';
};

/**
 * A short list of choices shown all at once, instead of a native dropdown whose popup
 * can't be styled. Real radio buttons underneath, so forms, keyboards and screen readers just work.
 */
export function ChoiceField({ label, name, options, defaultValue, required, error, variant = 'cards' }: Props) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  return (
    <fieldset className="field choice-field" aria-describedby={errorId} aria-invalid={error ? true : undefined}>
      <legend className="field-label">{label}</legend>
      <div className={`choice-${variant}`}>
        {options.map((o) => (
          <label key={o.value} className="choice">
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={defaultValue === o.value}
              required={required}
              className="visually-hidden"
            />
            {o.media}
            <span className="choice-text">
              <span className="choice-label">{o.label}</span>
              {o.hint && <span className="choice-hint">{o.hint}</span>}
            </span>
            {variant === 'cards' && (
              <span className="choice-check" aria-hidden>
                <Check size={14} strokeWidth={3} />
              </span>
            )}
          </label>
        ))}
      </div>
      {error && (
        <span id={errorId} className="field-error">
          <CircleAlert size={14} aria-hidden />
          {error}
        </span>
      )}
    </fieldset>
  );
}
