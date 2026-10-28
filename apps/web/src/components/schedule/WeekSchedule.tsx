'use client';

import { CalendarPlus, Clock, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { SCHEDULE_DAYS, type Locale, type ScheduleDay, type ScheduleItemDTO } from '@ruya/shared';
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

/** US-06: the week from Saturday to Friday. Columns on wide screens, day sections on phones. */
export function WeekSchedule({ locale, childId, items, editable }: Props) {
  const t = dictionaries[locale];
  const s = t.schedule;
  const byDay = new Map<ScheduleDay, ScheduleItemDTO[]>(SCHEDULE_DAYS.map((d) => [d, []]));
  for (const item of items) byDay.get(item.day)?.push(item);

  return (
    <div className="week">
      {SCHEDULE_DAYS.map((day) => {
        const dayItems = byDay.get(day)!;
        return (
          <section key={day} className="week-day" data-empty={dayItems.length === 0 || undefined} aria-label={t.days[day]}>
            <header className="week-day-head">
              <h2>{t.days[day]}</h2>
              {dayItems.length > 0 && <span className="week-day-count">{s.count(dayItems.length)}</span>}
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

            {dayItems.length === 0 ? (
              <p className="week-free">{s.freeDay}</p>
            ) : (
              <ul className="week-items">
                {dayItems.map((item) => (
                  <li key={item.id} className="slot">
                    <div className="slot-main">
                      <span className="slot-time">
                        <Clock size={14} aria-hidden />
                        <span className="slot-range">
                          <span>{formatTime(item.startTime, locale)}</span>
                          <span aria-hidden>–</span>
                          <span>{formatTime(item.endTime, locale)}</span>
                        </span>
                      </span>
                      <strong className="slot-title">
                        <bdi>{item.activity}</bdi>
                      </strong>
                      {item.location && (
                        <span className="slot-place">
                          <MapPin size={14} aria-hidden />
                          <bdi>{item.location}</bdi>
                        </span>
                      )}
                    </div>
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
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
