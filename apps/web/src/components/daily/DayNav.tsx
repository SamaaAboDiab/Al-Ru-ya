import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { addDays, type Locale } from '@ruya/shared';
import { dictionaries, formatDayLong } from '@/lib/i18n';

type Props = { locale: Locale; basePath: string; date: string; today: string };

/** Previous / next day around the selected date. There is no "next" past today. */
export function DayNav({ locale, basePath, date, today }: Props) {
  const t = dictionaries[locale].day;
  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const hrefFor = (d: string) => (d === today ? basePath : `${basePath}?date=${d}`);

  return (
    <nav className="day-nav" aria-label={t.pickDate}>
      <Link href={hrefFor(prev)} className="icon-btn" aria-label={t.prev} title={t.prev}>
        <ChevronLeft size={20} aria-hidden className="rtl-flip" />
      </Link>
      <div className="day-nav-label">
        <strong>{formatDayLong(date, locale)}</strong>
        {date === today ? (
          <span className="chip chip-info">{t.today}</span>
        ) : (
          <Link href={basePath} className="day-nav-today">
            {t.today}
          </Link>
        )}
      </div>
      {next <= today ? (
        <Link href={hrefFor(next)} className="icon-btn" aria-label={t.next} title={t.next}>
          <ChevronRight size={20} aria-hidden className="rtl-flip" />
        </Link>
      ) : (
        <span className="icon-btn" aria-hidden data-disabled>
          <ChevronRight size={20} className="rtl-flip" />
        </span>
      )}
    </nav>
  );
}
