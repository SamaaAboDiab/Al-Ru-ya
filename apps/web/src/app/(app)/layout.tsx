import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { getCurrentUser, getLocale, getNotifications } from '@/lib/server';

/**
 * Shell for every signed-in page. The header lives here so it stays put while
 * pages change, and `loading.tsx` fills the content area during navigation.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Notifications are requested alongside the user so the header's bell doesn't wait for a second round trip.
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale(), getNotifications()]);
  if (!user) redirect('/login');

  return (
    <>
      <AppHeader locale={locale} user={user} />
      {children}
    </>
  );
}
