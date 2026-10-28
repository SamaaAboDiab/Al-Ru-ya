'use client';

import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  /** Labels for the show/hide button on password fields. */
  toggleLabels?: { show: string; hide: string };
};

export function Field({ label, hint, error, toggleLabels, type, ...input }: FieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const hasToggle = type === 'password' && toggleLabels;

  return (
    <div className={hasToggle ? 'field field-has-toggle' : 'field'}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="field-control">
        <input
          id={id}
          type={hasToggle && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId ?? hintId].filter(Boolean).join(' ') || undefined}
          {...input}
        />
        {hasToggle && (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? toggleLabels.hide : toggleLabels.show}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        )}
      </div>
      {error ? (
        <span id={errorId} className="field-error">
          <CircleAlert size={14} aria-hidden />
          {error}
        </span>
      ) : (
        hint && (
          <span id={hintId} className="field-hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
