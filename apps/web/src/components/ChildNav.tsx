'use client';

import { CalendarDays, ClipboardCheck, House, LayoutGrid, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';

/**
 * The child's five sections. `inline` sits in the header on wide screens; `bar` is the
 * bottom tab bar on phones. The bar must render outside the header: the header's
 * backdrop-filter would otherwise pin a fixed-position child to the header, not the screen.
 */
export function ChildNav({ locale, variant }: { locale: Locale; variant: 'inline' | 'bar' }) {
  const t = dictionaries[locale];
  const path = usePathname();
  const items = [
    { href: '/child', label: t.nav.home, Icon: LayoutGrid, exact: true },
    { href: '/child/schedule', label: t.schedule.myTitle, Icon: CalendarDays },
    { href: '/child/day', label: t.day.myTitle, Icon: ClipboardCheck },
    { href: '/child/visits', label: t.visits.myTitle, Icon: House },
    { href: '/child/messages', label: t.messages.myTitle, Icon: MessageCircle },
  ];

  return (
    <nav className={`child-nav child-nav-${variant}`} aria-label={t.nav.sections}>
      {items.map(({ href, label, Icon, exact }) => {
        const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className="child-nav-item" aria-current={active ? 'page' : undefined}>
            <Icon size={20} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
