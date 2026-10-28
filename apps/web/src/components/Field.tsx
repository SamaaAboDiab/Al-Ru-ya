import { useId, type InputHTMLAttributes } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({ label, hint, error, ...input }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...input}
      />
      {hint && !error && (
        <span id={hintId} className="hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="error">
          {error}
        </span>
      )}
    </div>
  );
}
