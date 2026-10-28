import { CalendarClock, CheckCircle2, Hourglass, XCircle } from 'lucide-react';
import type { Locale, VisitStatus } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';

const STYLE: Record<VisitStatus, { tone: string; Icon: typeof CheckCircle2 }> = {
  upcoming: { tone: 'chip-info', Icon: CalendarClock },
  pending: { tone: 'chip-warning', Icon: Hourglass },
  confirmed: { tone: 'chip-success', Icon: CheckCircle2 },
  cancelled: { tone: 'chip-danger', Icon: XCircle },
};

export function VisitStatusChip({ locale, status }: { locale: Locale; status: VisitStatus }) {
  const { tone, Icon } = STYLE[status];
  return (
    <span className={`chip ${tone}`}>
      <Icon size={14} aria-hidden />
      {dictionaries[locale].visits.statuses[status]}
    </span>
  );
}
