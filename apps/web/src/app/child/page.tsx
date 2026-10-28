import { CalendarDays, ChevronRight, ClipboardCheck, House, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DAILY_ITEMS, ROLES, todayIn } from '@ruya/shared';
import { AppHeader } from '@/components/AppHeader';
import { Forbidden } from '@/components/Forbidden';
import { HomeHero, nextUpcoming } from '@/components/HomeHero';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { getConversations, getCurrentUser, getDailyLog, getLocale, getVisits } from '@/lib/server';

const TILE_ICONS = [CalendarDays, ClipboardCheck, House, MessageCircle];
const TILE_HREFS = ['/child/schedule', '/child/day', '/child/visits', '/child/messages'];

export default async function ChildPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  if (user.role !== ROLES.CHILD || !user.childId) {
    return <Forbidden locale={locale} user={user} homeHref={homeFor(user.role)} />;
  }

  const [visits, log, conversations] = await Promise.all([
    getVisits(user.childId),
    getDailyLog(user.childId, todayIn()),
    getConversations(user.childId),
  ]);
  const t = dictionaries[locale];
  const next = nextUpcoming((visits ?? []).map((visit) => ({ visit, childName: user.name, href: `/child/visits/${visit.id}` })));
  const unread = (conversations ?? []).reduce((sum, c) => sum + c.unread, 0);

  // What each tile can tell at a glance, beyond its description.
  const status: (string | null)[] = [
    null,
    log ? t.home.dayProgress(log.entries.length, DAILY_ITEMS.length) : null,
    null,
    unread > 0 ? t.home.unreadMessages(unread) : null,
  ];

  return (
    <>
      <AppHeader locale={locale} user={user} />
      <main className="page">
        <HomeHero
          locale={locale}
          title={t.child.greeting(user.name)}
          subtitle={t.child.intro}
          next={next}
          withLabel={(v) => t.home.withParent(`${v.visit.parent.name} (${t.fields[v.visit.parent.role]})`)}
        />

        <ul className="tile-grid">
          {t.child.tiles.map((tile, i) => {
            const Icon = TILE_ICONS[i];
            return (
              <li key={tile.title}>
                <Link href={TILE_HREFS[i]} className="card tile tile-link">
                  <span className="tile-icon">
                    <Icon size={22} aria-hidden />
                  </span>
                  <div>
                    <h2 className="tile-title">{tile.title}</h2>
                    <p className="tile-desc">{tile.desc}</p>
                  </div>
                  {status[i] && <span className="tile-status">{status[i]}</span>}
                  <ChevronRight size={18} aria-hidden className="tile-arrow rtl-flip" />
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
