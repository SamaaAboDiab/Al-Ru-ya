import { CalendarDays, CheckCircle2, ClipboardCheck, House, LayoutGrid, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { ageInYears, type ChildDTO, type Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';
import { Avatar, toneOf } from './Avatar';
import { BackButton } from './BackButton';

export type ChildSection = 'overview' | 'schedule' | 'day' | 'visits' | 'messages';

/**
 * Parents' view of one child. The band takes the child's own color, so it is clear whose
 * page this is. Sections are tabs on wide screens and a bottom tab bar on phones.
 */
export function ChildContext({ locale, child, active }: { locale: Locale; child: ChildDTO; active: ChildSection }) {
  const t = dictionaries[locale];
  const base = `/parent/children/${child.id}`;
  const sections: { id: ChildSection; href: string; label: string; Icon: typeof House }[] = [
    { id: 'overview', href: base, label: t.overview.tab, Icon: LayoutGrid },
    { id: 'schedule', href: `${base}/schedule`, label: t.schedule.open, Icon: CalendarDays },
    { id: 'day', href: `${base}/day`, label: t.day.open, Icon: ClipboardCheck },
    { id: 'visits', href: `${base}/visits`, label: t.visits.open, Icon: House },
    { id: 'messages', href: `${base}/messages`, label: t.messages.open, Icon: MessageCircle },
  ];

  const links = (className: string) =>
    sections.map(({ id, href, label, Icon }) => (
      <Link key={id} href={href} className={className} aria-current={id === active ? 'page' : undefined}>
        <Icon size={20} aria-hidden />
        <span>{label}</span>
      </Link>
    ));

  return (
    <>
      <header className="child-band" data-tone={toneOf(child.id)}>
        <BackButton href="/parent" label={t.nav.myChildren} />
        <Avatar name={child.name} id={child.id} photo={child.photoUrl} size="xl" />
        <div className="child-band-text">
          <h1 className="child-band-name">
            <bdi>{child.name}</bdi>
          </h1>
          <p className="child-band-meta">
            <span>{t.parent.age(ageInYears(child.birthDate))}</span>
            {child.hasAccount && (
              <span className="child-band-flag">
                <CheckCircle2 size={14} aria-hidden />
                {t.parent.hasAccount}
              </span>
            )}
          </p>
        </div>
      </header>

      <nav className="tabs child-tabs" aria-label={child.name}>
        {links('tab')}
      </nav>
      <nav className="child-tabbar" aria-label={child.name}>
        {links('child-nav-item')}
      </nav>
    </>
  );
}
