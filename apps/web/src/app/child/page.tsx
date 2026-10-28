import { CalendarDays, ChevronRight, ClipboardCheck, House, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ROLES } from '@ruya/shared';
import { AppHeader } from '@/components/AppHeader';
import { Forbidden } from '@/components/Forbidden';
import { LogoMark } from '@/components/Logo';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getLocale } from '@/lib/server';

const TILE_ICONS = [CalendarDays, ClipboardCheck, House, MessageCircle];
/** Features that are live link to their page; the rest show "coming soon". */
const TILE_HREFS: (string | null)[] = ['/child/schedule', null, null, null];

export default async function ChildPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role !== ROLES.CHILD) return <Forbidden locale={locale} user={user} homeHref={homeFor(user.role)} />;

  const t = dictionaries[locale].child;
  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page">
        <section className="hero">
          <div>
            <h1>{t.greeting(user.name)}</h1>
            <p>{t.intro}</p>
          </div>
          <LogoMark size={140} className="hero-mark" />
        </section>

        <ul className="tile-grid">
          {t.tiles.map((tile, i) => {
            const Icon = TILE_ICONS[i];
            const href = TILE_HREFS[i];
            const content = (
              <>
                <span className="tile-icon">
                  <Icon size={22} aria-hidden />
                </span>
                <div>
                  <h2 className="tile-title">{tile.title}</h2>
                  <p className="tile-desc">{tile.desc}</p>
                </div>
              </>
            );
            return href ? (
              <li key={tile.title}>
                <Link href={href} className="card tile tile-link">
                  {content}
                  <ChevronRight size={18} aria-hidden className="tile-arrow rtl-flip" />
                </Link>
              </li>
            ) : (
              <li key={tile.title} className="card tile tile-soon" aria-disabled="true">
                {content}
                <span className="chip chip-info">{t.soon}</span>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
