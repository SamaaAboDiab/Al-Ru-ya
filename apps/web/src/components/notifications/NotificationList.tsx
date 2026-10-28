'use client';

import { CalendarCheck, CalendarPlus, CalendarX, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { NOTIFICATION_TYPES, type Locale, type NotificationDTO, type NotificationType } from '@ruya/shared';
import { apiPost } from '@/lib/client';
import { dictionaries, formatDateTime, formatDayLong, formatTime } from '@/lib/i18n';

const ICONS: Record<NotificationType, typeof CalendarPlus> = {
  [NOTIFICATION_TYPES.VISIT_LOGGED]: CalendarPlus,
  [NOTIFICATION_TYPES.VISIT_CONFIRMED]: CalendarCheck,
  [NOTIFICATION_TYPES.VISIT_CANCELLED]: CalendarX,
};

type Props = { locale: Locale; items: NotificationDTO[]; isChild: boolean };

/** US-12: each notification opens the visit it's about, and is marked read on the way. */
export function NotificationList({ locale, items: initial, isChild }: Props) {
  const t = dictionaries[locale];
  const n = t.notifications;
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const unread = items.filter((i) => !i.read).length;

  const hrefFor = (item: NotificationDTO) =>
    isChild ? `/child/visits/${item.visitId}` : `/parent/children/${item.childId}/visits/${item.visitId}`;

  async function open(item: NotificationDTO) {
    if (!item.read) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      await apiPost(`/api/notifications/${item.id}/read`);
    }
    router.push(hrefFor(item));
  }

  async function markAll() {
    setItems((list) => list.map((i) => ({ ...i, read: true })));
    await apiPost('/api/notifications/read-all');
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="empty-state">{n.empty}</p>;
  }

  return (
    <div className="stack">
      {unread > 0 && (
        <div className="notif-toolbar">
          <span className="chip chip-info">{n.unread(unread)}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={markAll}>
            <CheckCheck size={16} aria-hidden />
            {n.markAll}
          </button>
        </div>
      )}
      <ul className="notif-list">
        {items.map((item) => {
          const Icon = ICONS[item.type];
          const when = n.when(formatDayLong(item.visitDate, locale), formatTime(item.visitTime, locale));
          const reason = item.reason
            ? [item.reason.code ? t.visits.reasons[item.reason.code] : null, item.reason.note].filter(Boolean).join(locale === 'ar' ? '، ' : ', ')
            : null;
          return (
            <li key={item.id}>
              <button type="button" className="notif" data-type={item.type} data-unread={!item.read || undefined} onClick={() => open(item)}>
                <span className="notif-icon">
                  <Icon size={20} aria-hidden />
                </span>
                <span className="notif-text">
                  <span className="notif-head">
                    <span className="notif-title">{n[item.type]}</span>
                    <span className="notif-child">
                      <bdi>{item.childName}</bdi>
                    </span>
                  </span>
                  <span className="notif-body">{n.body[item.type](item.actorName, when)}</span>
                  {reason && (
                    <span className="notif-reason">
                      {t.visits.reason}: <bdi>{reason}</bdi>
                    </span>
                  )}
                  <span className="notif-time">{formatDateTime(item.createdAt, locale)}</span>
                </span>
                {!item.read && <span className="notif-dot" aria-label={n.unread(1)} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
