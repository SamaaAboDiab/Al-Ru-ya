import { Clock } from 'lucide-react';
import Link from 'next/link';
import type { Locale, VisitDTO } from '@ruya/shared';
import { Avatar } from '@/components/Avatar';
import { dictionaries, formatDateParts, formatDayLong, formatTime } from '@/lib/i18n';
import { VisitStatusChip } from './VisitStatusChip';

export function timeRange(v: Pick<VisitDTO, 'startTime' | 'endTime'>, locale: Locale) {
  return v.endTime ? `${formatTime(v.startTime, locale)} – ${formatTime(v.endTime, locale)}` : formatTime(v.startTime, locale);
}

export function reasonText(v: Pick<VisitDTO, 'cancelReason'>, locale: Locale) {
  const r = v.cancelReason;
  if (!r) return null;
  const label = r.code ? dictionaries[locale].visits.reasons[r.code] : null;
  return [label, r.note].filter(Boolean).join(locale === 'ar' ? '، ' : ', ');
}

/** US-13: one row per visit, newest first, linking to its details. */
export function VisitList({ locale, visits, basePath }: { locale: Locale; visits: VisitDTO[]; basePath: string }) {
  const t = dictionaries[locale];
  return (
    <ul className="visit-list">
      {visits.map((v) => {
        const reason = reasonText(v, locale);
        const date = formatDateParts(v.date, locale);
        return (
          <li key={v.id}>
            <Link href={`${basePath}/${v.id}`} className="visit-card" data-status={v.status}>
              {/* A calendar leaf: the date is what people scan for, so it leads. */}
              <span className="visit-leaf" aria-hidden>
                <span className="visit-leaf-day display">{date.day}</span>
                <span className="visit-leaf-month">{date.month}</span>
              </span>
              <span className="visit-card-body">
                <span className="visit-card-top">
                  <strong className="visit-card-weekday">{date.weekday}</strong>
                  <VisitStatusChip locale={locale} status={v.status} />
                </span>
                <span className="visit-card-line">
                  <Clock size={15} aria-hidden />
                  {timeRange(v, locale)}
                </span>
                <span className="visit-card-line">
                  <Avatar name={v.parent.name} id={v.parent.id} photo={v.parent.photoUrl} size="sm" />
                  {t.visits.with(v.parent.name, t.fields[v.parent.role])}
                </span>
                {reason && (
                  <span className="visit-card-reason">
                    <strong>{t.visits.reason}:</strong> <bdi>{reason}</bdi>
                  </span>
                )}
              </span>
              <span className="visually-hidden">{formatDayLong(v.date, locale)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
