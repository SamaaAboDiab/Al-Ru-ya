import { CircleAlert, CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';

export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'warning'; children: ReactNode }) {
  const Icon = tone === 'success' ? CircleCheck : CircleAlert;
  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden />
      <div>{children}</div>
    </div>
  );
}
