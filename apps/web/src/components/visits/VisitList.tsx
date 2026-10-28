import { ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Locale, VisitDTO } from '@ruya/shared';
import { Avatar } from '@/components/Avatar';
import { dictionaries, formatDayLong, formatTime } from '@/lib/i18n';
import { VisitStatusChip } from './VisitStatusChip';

export function timeRange(v: Pick<VisitDTO, 'startTime' | 'endTime'>, locale: Locale) {
  return v.endTime ? `${formatTime(v.startTime, locale)} – ${formatTime(v.endTime, locale)}` : formatTime(v.startTime, locale);
}

export function reasonText(v: Pick<VisitDTO, 'cancelReason'>, locale: Locale) {
  const r = v.cancelReason;
  if (!r) return null;
  const label = r.code ? dictionaries[locale].visits.reasons[r.code] : null;
  return [label, r.note].filter(Boolean).join(' · ');
}

/** US-13: one row per visit, newest first, linking to its details. */
export function VisitList({ locale, visits, basePath }: { locale: Locale; visits: VisitDTO[]; basePath: string }) {
  const t = dictionaries[locale];
  return (
    <ul className="visit-list">
      {visits.map((v) => {
        const reason = reasonText(v, locale);
        return (
          <li key={v.id}>
            <Link href={`${basePath}/${v.id}`} className="card visit-row" data-status={v.status}>
              <div className="visit-row-date">
                <strong>{formatDayLong(v.date, locale)}</strong>
                <span className="visit-row-time">
                  <Clock size={14} aria-hidden />
                  {timeRange(v, locale)}
                </span>
              </div>
              <div className="visit-row-who">
                <Avatar name={v.parent.name} id={v.parent.id} size="sm" />
                <span>{t.visits.with(v.parent.name, t.fields[v.parent.role])}</span>
              </div>
              {reason && (
                <p className="visit-row-reason">
                  {t.visits.reason}: <bdi>{reason}</bdi>
                </p>
              )}
              <div className="visit-row-end">
                <VisitStatusChip locale={locale} status={v.status} />
                <ChevronRight size={18} aria-hidden className="rtl-flip visit-row-arrow" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
