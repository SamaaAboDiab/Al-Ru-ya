import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Locale } from '@ruya/shared';
import { formatNumber } from '@/lib/i18n';

export type MenuItem = { href: string; label: string; Icon: LucideIcon; badge?: number };

/** A grouped list of links: icon, label, optional count, and a direction-aware chevron. */
export function MenuList({ locale, items, children }: { locale: Locale; items: MenuItem[]; children?: ReactNode }) {
  return (
    <ul className="menu-list">
      {items.map(({ href, label, Icon, badge }) => (
        <li key={href}>
          <Link href={href} className="menu-row">
            <span className="menu-icon">
              <Icon size={20} aria-hidden />
            </span>
            <span className="menu-label">{label}</span>
            {badge ? <span className="count-badge count-badge-danger">{formatNumber(badge, locale)}</span> : null}
            <ChevronRight size={18} aria-hidden className="rtl-flip menu-chevron" />
          </Link>
        </li>
      ))}
      {children}
    </ul>
  );
}
