import { CircleCheck, CirclePlus, CircleX, Clock, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Locale, VisitAction, VisitDTO } from '@ruya/shared';
import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { dictionaries, formatDateParts, formatDateTime, formatDayLong } from '@/lib/i18n';
import { reasonText, timeRange } from './VisitList';
import { VisitStatusChip } from './VisitStatusChip';

const ACTION_ICONS: Record<VisitAction, typeof CircleCheck> = {
  created: CirclePlus,
  edited: Pencil,
  confirmed: CircleCheck,
  cancelled: CircleX,
};

/** US-10/13: the visit as a large calendar leaf, the cancellation reason, actions, and the full change log. */
export function VisitDetail({
  locale,
  visit,
  back,
  actions,
}: {
  locale: Locale;
  visit: VisitDTO;
  /** Back to the visit list; sits beside the title. */
  back: { href: string; label: string };
  actions?: ReactNode;
}) {
  const t = dictionaries[locale];
  const reason = reasonText(visit, locale);
  const date = formatDateParts(visit.date, locale);

  return (
    <>
      <div className="page-head">
        <BackButton href={back.href} label={back.label} />
        <div>
          <h1 className="page-title">{t.visits.details}</h1>
          <p className="page-subtitle">{formatDayLong(visit.date, locale)}</p>
        </div>
      </div>

      <div className="visit-detail">
        <section className="card visit-hero" data-status={visit.status} aria-label={t.visits.details}>
          <div className="visit-hero-main">
            <span className="visit-leaf visit-leaf-lg" aria-hidden>
              <span className="visit-leaf-day display">{date.day}</span>
              <span className="visit-leaf-month">{date.month}</span>
            </span>
            <div className="visit-hero-body">
              <div className="visit-card-top">
                <h2 className="visit-hero-weekday">{date.weekday}</h2>
                <VisitStatusChip locale={locale} status={visit.status} />
              </div>
              <span className="visit-card-line">
                <Clock size={16} aria-hidden />
                {timeRange(visit, locale)}
              </span>
              <span className="visit-card-line">
                <Avatar name={visit.parent.name} id={visit.parent.id} size="sm" />
                {t.visits.with(visit.parent.name, t.fields[visit.parent.role])}
              </span>
            </div>
          </div>

          {reason && (
            <p className="visit-card-reason visit-hero-reason">
              <strong>{t.visits.reason}:</strong> <bdi>{reason}</bdi>
            </p>
          )}
          {actions && <div className="visit-hero-actions">{actions}</div>}
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
    </>
  );
}
