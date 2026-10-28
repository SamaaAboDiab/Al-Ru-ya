import { CalendarDays, CircleCheck, CirclePlus, CircleX, Clock, Pencil, User } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Locale, VisitAction, VisitDTO } from '@ruya/shared';
import { FormAlert } from '@/components/FormAlert';
import { dictionaries, formatDateTime, formatDayLong } from '@/lib/i18n';
import { reasonText, timeRange } from './VisitList';
import { VisitStatusChip } from './VisitStatusChip';

const ACTION_ICONS: Record<VisitAction, typeof CircleCheck> = {
  created: CirclePlus,
  edited: Pencil,
  confirmed: CircleCheck,
  cancelled: CircleX,
};

/** US-10/13: the facts, the cancellation reason, the full change log, and any actions for this user. */
export function VisitDetail({ locale, visit, actions }: { locale: Locale; visit: VisitDTO; actions?: ReactNode }) {
  const t = dictionaries[locale];
  const reason = reasonText(visit, locale);

  return (
    <div className="visit-detail">
      <section className="card stack">
        <div className="visit-detail-head">
          <h2 className="section-title" style={{ margin: 0 }}>
            {t.visits.details}
          </h2>
          <VisitStatusChip locale={locale} status={visit.status} />
        </div>
        <dl className="visit-facts">
          <div>
            <dt>
              <CalendarDays size={16} aria-hidden /> {t.visits.date}
            </dt>
            <dd>{formatDayLong(visit.date, locale)}</dd>
          </div>
          <div>
            <dt>
              <Clock size={16} aria-hidden /> {t.visits.time}
            </dt>
            <dd>{timeRange(visit, locale)}</dd>
          </div>
          <div>
            <dt>
              <User size={16} aria-hidden /> {t.visits.visitWith}
            </dt>
            <dd>
              <bdi>{visit.parent.name}</bdi> ({t.fields[visit.parent.role]})
            </dd>
          </div>
        </dl>
        {reason && (
          <FormAlert tone="error">
            <strong>{t.visits.reason}:</strong> <bdi>{reason}</bdi>
          </FormAlert>
        )}
        {actions}
      </section>

      <section className="card">
        <h2 className="section-title">{t.visits.history}</h2>
        <ol className="timeline">
          {visit.history.map((h, i) => {
            const Icon = ACTION_ICONS[h.action];
            return (
              <li key={i} className="timeline-item" data-action={h.action}>
                <span className="timeline-dot">
                  <Icon size={16} aria-hidden />
                </span>
                <div>
                  <strong>{t.visits.actions[h.action]}</strong>{' '}
                  <span className="muted">
                    {t.visits.by(h.byName)} ({h.byRole === 'child' ? t.nav.child : t.fields[h.byRole]})
                  </span>
                  <div className="timeline-time">{formatDateTime(h.at, locale)}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
