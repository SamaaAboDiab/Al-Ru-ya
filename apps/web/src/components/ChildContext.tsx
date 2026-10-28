import { ArrowLeft, CalendarDays, ClipboardCheck, House, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { ageInYears, type ChildDTO, type Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';
import { Avatar } from './Avatar';

export type ChildSection = 'schedule' | 'day' | 'visits' | 'messages';

/**
 * Parents' view of one child: who it is, plus tabs for the four areas.
 * Keeps the child in view while moving between schedule, daily log, visits and messages.
 */
export function ChildContext({
  locale,
  child,
  active,
  subtitle,
}: {
  locale: Locale;
  child: ChildDTO;
  active: ChildSection;
  subtitle?: string;
}) {
  const t = dictionaries[locale];
  const base = `/parent/children/${child.id}`;
  const tabs: { id: ChildSection; label: string; Icon: typeof House }[] = [
    { id: 'schedule', label: t.schedule.open, Icon: CalendarDays },
    { id: 'day', label: t.day.open, Icon: ClipboardCheck },
    { id: 'visits', label: t.visits.open, Icon: House },
    { id: 'messages', label: t.messages.open, Icon: MessageCircle },
  ];

  return (
    <header className="child-context">
      <Link href="/parent" className="back-link">
        <ArrowLeft size={18} aria-hidden className="rtl-flip" />
        {t.nav.myChildren}
      </Link>
      <div className="child-context-who">
        <Avatar name={child.name} id={child.id} size="lg" />
        <div>
          <h1 className="page-title">
            <bdi>{child.name}</bdi>
          </h1>
          <p className="page-subtitle">{subtitle ?? t.parent.age(ageInYears(child.birthDate))}</p>
        </div>
      </div>
      <nav className="tabs" aria-label={child.name}>
        {tabs.map(({ id, label, Icon }) => (
          <Link key={id} href={`${base}/${id}`} className="tab" aria-current={id === active ? 'page' : undefined}>
            <Icon size={18} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
