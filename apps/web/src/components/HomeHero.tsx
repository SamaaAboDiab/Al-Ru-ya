import { BellRing, CalendarClock, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { VISIT_STATUSES, addDays, todayIn, type Locale, type VisitDTO } from '@ruya/shared';
import { dictionaries, formatDayLong } from '@/lib/i18n';
import { LogoMark } from './Logo';
import { timeRange } from './visits/VisitList';

export type HomeVisit = { visit: VisitDTO; childName: string; href: string };

/** The soonest visit that hasn't started yet, across all the given visits. */
export function nextUpcoming(visits: HomeVisit[]) {
  return visits
    .filter((v) => v.visit.status === VISIT_STATUSES.UPCOMING)
    .sort((a, b) => `${a.visit.date}${a.visit.startTime}`.localeCompare(`${b.visit.date}${b.visit.startTime}`))[0];
}

function dayLabel(date: string, locale: Locale) {
  const t = dictionaries[locale].home;
  const today = todayIn();
  if (date === today) return t.today;
  if (date === addDays(today, 1)) return t.tomorrow;
  return formatDayLong(date, locale);
}

type Props = {
  locale: Locale;
  title: string;
  subtitle: string;
  next?: HomeVisit;
  /** Visits waiting for this user to confirm (parents only). */
  toConfirm?: { count: number; href: string };
  /** Whose name to show on the next-visit card: the child's (parents) or the parent's (child). */
  withLabel?: (v: HomeVisit) => string;
  action?: ReactNode;
};

/**
 * The one bold moment on the home screens: a navy band that answers
 * "when is the next visit?" before anything else.
 */
export function HomeHero({ locale, title, subtitle, next, toConfirm, withLabel, action }: Props) {
  const t = dictionaries[locale].home;
  return (
    <section className="home-hero">
      <div className="home-hero-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {action && <div className="home-hero-action">{action}</div>}
      </div>

      <div className="home-hero-side">
        {next ? (
          <Link href={next.href} className="next-visit">
            <span className="next-visit-label">
              <CalendarClock size={18} aria-hidden />
              {t.nextVisit}
            </span>
            <strong className="next-visit-day display">{dayLabel(next.visit.date, locale)}</strong>
            <span className="next-visit-time">
              <Clock size={16} aria-hidden />
              {timeRange(next.visit, locale)}
            </span>
            <span className="next-visit-with">{withLabel ? withLabel(next) : next.childName}</span>
            <ChevronRight size={20} aria-hidden className="rtl-flip next-visit-arrow" />
          </Link>
        ) : (
          <div className="next-visit next-visit-empty">
            <span className="next-visit-label">
              <CalendarClock size={18} aria-hidden />
              {t.nextVisit}
            </span>
            <p>{t.noUpcoming}</p>
          </div>
        )}
        {toConfirm && toConfirm.count > 0 && (
          <Link href={toConfirm.href} className="to-confirm">
            <BellRing size={18} aria-hidden />
            {t.toConfirm(toConfirm.count)}
            <ChevronRight size={18} aria-hidden className="rtl-flip" />
          </Link>
        )}
      </div>
      <LogoMark size={220} className="home-hero-mark" />
    </section>
  );
}
