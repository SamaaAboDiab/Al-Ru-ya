import { CalendarDays, ChevronRight, ClipboardCheck, Clock, House, MapPin, MessageCircle, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  DAILY_ITEMS,
  INVITE_STATUSES,
  MAX_PARENTS_PER_CHILD,
  MIN_CHILD_ACCOUNT_AGE,
  ROLES,
  ageInYears,
  todayIn,
  type ScheduleDay,
} from '@ruya/shared';
import { ChildActions } from '@/app/(app)/parent/ChildActions';
import { ChildContext } from '@/components/ChildContext';
import { Forbidden } from '@/components/Forbidden';
import { nextUpcoming } from '@/components/HomeHero';
import { timeRange } from '@/components/visits/VisitList';
import { VisitStatusChip } from '@/components/visits/VisitStatusChip';
import { dictionaries, formatClock, formatDate, formatDayLong, formatNumber, formatTime } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import {
  getChild,
  getConversations,
  getCurrentUser,
  getDailyLog,
  getInvitations,
  getLocale,
  getSchedule,
  getVisits,
} from '@/lib/server';

const WEEKDAYS: ScheduleDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** One child's page for a parent: what today looks like, then a way into each area. */
export default async function ChildOverviewPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  if (!user) notFound();
  if (user.role === ROLES.CHILD) return <Forbidden locale={locale} homeHref={homeFor(user.role)} />;

  const today = todayIn();
  const [child, visits, schedule, log, conversations, invitations] = await Promise.all([
    getChild(childId),
    getVisits(childId),
    getSchedule(childId),
    getDailyLog(childId, today),
    getConversations(childId),
    getInvitations(childId),
  ]);
  if (!child) notFound();

  const t = dictionaries[locale];
  const o = t.overview;
  const base = `/parent/children/${childId}`;
  const weekday = WEEKDAYS[new Date(`${today}T00:00:00Z`).getUTCDay()];
  const todayItems = (schedule ?? []).filter((i) => i.day === weekday);
  const done = log?.entries.length ?? 0;
  const next = nextUpcoming((visits ?? []).map((visit) => ({ visit, childName: child.name, href: `${base}/visits/${visit.id}` })));
  const toConfirm = (visits ?? []).filter((v) => v.canConfirm);
  const conversation = conversations?.[0];

  const age = ageInYears(child.birthDate);
  const canCreateLogin = !child.hasAccount && age >= MIN_CHILD_ACCOUNT_AGE;
  const canInvite = child.parents.length < MAX_PARENTS_PER_CHILD;
  const pendingInvite = invitations?.find((i) => i.status === INVITE_STATUSES.PENDING);

  return (
    <main className="page child-page">
      <ChildContext locale={locale} child={child} active="overview" />

      <p className="overview-date display">
        {o.today}، {formatDayLong(today, locale)}
      </p>

      <div className="overview-grid">
        {/* Today's schedule: the most concrete answer to "what is my child doing today?" */}
        <section className="card overview-card overview-schedule">
          <header className="overview-card-head">
            <span className="overview-icon">
              <CalendarDays size={20} aria-hidden />
            </span>
            <h2>{o.scheduleToday}</h2>
            <Link href={`${base}/schedule`} className="overview-more">
              {o.fullSchedule}
              <ChevronRight size={16} aria-hidden className="rtl-flip" />
            </Link>
          </header>
          {!child.hasAccount ? (
            <p className="overview-empty">{o.noAccount}</p>
          ) : todayItems.length === 0 ? (
            <p className="overview-empty">{o.noScheduleToday}</p>
          ) : (
            <ol className="agenda">
              {todayItems.map((item) => (
                <li key={item.id}>
                  <span className="agenda-time display">{formatTime(item.startTime, locale)}</span>
                  <span className="agenda-body">
                    <strong>
                      <bdi>{item.activity}</bdi>
                    </strong>
                    <span className="agenda-meta">
                      <Clock size={14} aria-hidden />
                      {formatTime(item.startTime, locale)} – {formatTime(item.endTime, locale)}
                      {item.location && (
                        <>
                          <MapPin size={14} aria-hidden />
                          <bdi>{item.location}</bdi>
                        </>
                      )}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Daily log */}
        <Link href={`${base}/day`} className="card overview-card overview-link">
          <header className="overview-card-head">
            <span className="overview-icon">
              <ClipboardCheck size={20} aria-hidden />
            </span>
            <h2>{o.dayLog}</h2>
            <ChevronRight size={18} aria-hidden className="rtl-flip overview-chevron" />
          </header>
          <div className="overview-progress">
            <strong className="overview-big display">
              {formatNumber(done, locale)}
              <span>/{formatNumber(DAILY_ITEMS.length, locale)}</span>
            </strong>
            <div className="day-progress-bar" aria-hidden>
              <span style={{ inlineSize: `${(done / DAILY_ITEMS.length) * 100}%` }} />
            </div>
            <p className="overview-sub">
              {log?.entries.length
                ? log.entries.map((e) => t.dailyItems[e.item]).join(locale === 'ar' ? '، ' : ', ')
                : t.day.emptyDay}
            </p>
          </div>
        </Link>

        {/* Visits */}
        <Link href={`${base}/visits`} className="card overview-card overview-link">
          <header className="overview-card-head">
            <span className="overview-icon">
              <House size={20} aria-hidden />
            </span>
            <h2>{o.visits}</h2>
            <ChevronRight size={18} aria-hidden className="rtl-flip overview-chevron" />
          </header>
          {toConfirm.length > 0 && <p className="overview-alert">{t.home.toConfirm(toConfirm.length)}</p>}
          {next ? (
            <div className="overview-visit">
              <span className="overview-label">{t.home.nextVisit}</span>
              <strong className="display">{formatDayLong(next.visit.date, locale)}</strong>
              <span className="overview-sub">
                {timeRange(next.visit, locale)}، {t.home.withParent(next.visit.parent.name)}
              </span>
              <VisitStatusChip locale={locale} status={next.visit.status} />
            </div>
          ) : (
            <p className="overview-empty">{t.home.noUpcoming}</p>
          )}
        </Link>

        {/* This parent's own conversation */}
        <Link href={`${base}/messages`} className="card overview-card overview-link">
          <header className="overview-card-head">
            <span className="overview-icon">
              <MessageCircle size={20} aria-hidden />
            </span>
            <h2>{o.messages}</h2>
            {conversation && conversation.unread > 0 ? (
              <span className="count-badge">{formatNumber(conversation.unread, locale)}</span>
            ) : (
              <ChevronRight size={18} aria-hidden className="rtl-flip overview-chevron" />
            )}
          </header>
          {conversation?.lastMessage ? (
            <div className="overview-message">
              <p dir="auto">
                {conversation.lastMessage.fromMe && o.you}
                {conversation.lastMessage.body}
              </p>
              <span className="overview-sub">{formatClock(conversation.lastMessage.createdAt, locale)}</span>
            </div>
          ) : (
            <p className="overview-empty">{o.noMessages}</p>
          )}
        </Link>
      </div>

      {(canCreateLogin || canInvite) && (
        <section className="overview-setup">
          <h2 className="overview-setup-title">
            <Settings2 size={18} aria-hidden />
            {o.setup}
          </h2>
          <ChildActions
            locale={locale}
            childId={child.id}
            childName={child.name}
            canCreateLogin={canCreateLogin}
            canInvite={canInvite}
            pendingInvite={
              pendingInvite
                ? { email: pendingInvite.email, until: formatDate(pendingInvite.expiresAt.slice(0, 10), locale) }
                : undefined
            }
          />
        </section>
      )}
    </main>
  );
}
