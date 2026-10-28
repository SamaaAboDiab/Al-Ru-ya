import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: ReactNode;
};

/** Button that shows a spinner and blocks repeat clicks while a request runs. */
export function SubmitButton({ loading, children, className = 'btn btn-primary', type = 'submit', ...rest }: Props) {
  return (
    <button type={type} className={className} disabled={loading || rest.disabled} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="spinner" aria-hidden />}
      {children}
    </button>
  );
}
