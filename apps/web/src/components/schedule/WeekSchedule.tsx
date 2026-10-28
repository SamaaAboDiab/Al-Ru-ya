'use client';

import { CalendarPlus, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  FAMILY_TIMEZONE,
  SCHEDULE_DAYS,
  type Locale,
  type ScheduleDay,
  type ScheduleItemDTO,
} from '@ruya/shared';
import { Dialog } from '@/components/Dialog';
import { dictionaries, formatTime } from '@/lib/i18n';
import { DeleteScheduleItem } from './DeleteScheduleItem';
import { ScheduleItemForm } from './ScheduleItemForm';

type Props = {
  locale: Locale;
  childId: string;
  items: ScheduleItemDTO[];
  /** Only the child's own view can add, edit and delete. */
  editable: boolean;
};

type Period = 'morning' | 'afternoon' | 'evening';

function periodOf(time: string): Period {
  const hour = Number(time.slice(0, 2));
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

function todayKey(): ScheduleDay {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: FAMILY_TIMEZONE }).format(new Date());
  return weekday.toLowerCase() as ScheduleDay;
}

/** US-06: the week from Saturday to Friday, one row per day. Today is marked, empty days stay slim. */
export function WeekSchedule({ locale, childId, items, editable }: Props) {
  const t = dictionaries[locale];
  const s = t.schedule;
  const today = todayKey();
  const byDay = new Map<ScheduleDay, ScheduleItemDTO[]>(SCHEDULE_DAYS.map((d) => [d, []]));
  for (const item of items) byDay.get(item.day)?.push(item);
  for (const list of byDay.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="week">
      {SCHEDULE_DAYS.map((day) => {
        const dayItems = byDay.get(day)!;
        const isToday = day === today;
        return (
          <section
            key={day}
            className="week-day"
            data-empty={dayItems.length === 0 || undefined}
            data-today={isToday || undefined}
            aria-label={t.days[day]}
          >
            <header className="week-day-head">
              <h2>{t.days[day]}</h2>
              {isToday && <span className="week-today">{s.today}</span>}
              <span className="week-day-count">{dayItems.length > 0 ? s.count(dayItems.length) : s.freeDay}</span>
              {editable && (
                <Dialog
                  title={s.addTitle}
                  description={t.days[day]}
                  icon={<CalendarPlus size={22} aria-hidden />}
                  closeLabel={t.close}
                  trigger={(open) => (
                    <button
                      type="button"
                      className="icon-btn icon-btn-sm week-day-add"
                      onClick={open}
                      aria-label={`${s.add}: ${t.days[day]}`}
                      title={s.add}
                    >
                      <Plus size={16} aria-hidden />
                    </button>
                  )}
                >
                  {(close) => <ScheduleItemForm locale={locale} childId={childId} defaultDay={day} onDone={close} />}
                </Dialog>
              )}
            </header>

            {dayItems.length > 0 && (
              <ul className="week-items">
                {dayItems.map((item) => {
                  const period = periodOf(item.startTime);
                  return (
                    <li key={item.id} className="slot" data-period={period}>
                      <div className="slot-when">
                        <span className="slot-range">
                          <span className="slot-start">{formatTime(item.startTime, locale)}</span>
                          <span className="slot-end">
                            <span aria-hidden>– </span>
                            {formatTime(item.endTime, locale)}
                          </span>
                        </span>
                        <span className="slot-period">{s.periods[period]}</span>
                      </div>
                      <strong className="slot-title">
                        <bdi>{item.activity}</bdi>
                      </strong>
                      {(item.location || editable) && (
                        <div className="slot-foot">
                          {item.location && (
                            <span className="slot-place">
                              <MapPin size={14} aria-hidden />
                              <bdi>{item.location}</bdi>
                            </span>
                          )}
                          {editable && (
                            <div className="slot-actions">
                              <Dialog
                                title={s.editTitle}
                                icon={<Pencil size={20} aria-hidden />}
                                closeLabel={t.close}
                                trigger={(open) => (
                                  <button
                                    type="button"
                                    className="icon-btn icon-btn-sm"
                                    onClick={open}
                                    aria-label={`${s.edit}: ${item.activity}`}
                                    title={s.edit}
                                  >
                                    <Pencil size={15} aria-hidden />
                                  </button>
                                )}
                              >
                                {(close) => <ScheduleItemForm locale={locale} childId={childId} item={item} onDone={close} />}
                              </Dialog>
                              <Dialog
                                title={s.deleteTitle}
                                description={s.deleteBody(item.activity)}
                                icon={<Trash2 size={20} aria-hidden />}
                                closeLabel={t.close}
                                trigger={(open) => (
                                  <button
                                    type="button"
                                    className="icon-btn icon-btn-sm icon-btn-danger"
                                    onClick={open}
                                    aria-label={`${s.delete}: ${item.activity}`}
                                    title={s.delete}
                                  >
                                    <Trash2 size={15} aria-hidden />
                                  </button>
                                )}
                              >
                                {(close) => <DeleteScheduleItem locale={locale} childId={childId} item={item} onDone={close} />}
                              </Dialog>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
