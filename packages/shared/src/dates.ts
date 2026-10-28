import { FAMILY_TIMEZONE } from './constants';

/** The calendar date (YYYY-MM-DD) it is right now in `timeZone`. */
export function todayIn(timeZone: string = FAMILY_TIMEZONE, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** The date (YYYY-MM-DD) and wall-clock time (HH:MM) it is right now in `timeZone`. */
export function nowIn(timeZone: string = FAMILY_TIMEZONE, now: Date = new Date()): { date: string; time: string } {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return { date: todayIn(timeZone, now), time };
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
