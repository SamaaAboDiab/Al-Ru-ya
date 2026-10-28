import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { homeFor, safeNext } from '@/lib/routes';
import { getCurrentUser, getLocale } from '@/lib/server';
import { EmailLinkForm } from './EmailLinkForm';

type SearchParams = Promise<{ next?: string | string[]; email?: string | string[] }>;

export default async function EmailLinkPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const next = safeNext(query.next);
  const user = await getCurrentUser();
  if (user) redirect(next ?? homeFor(user.role));

  const locale = await getLocale();
  return (
    <AuthShell locale={locale}>
      <EmailLinkForm locale={locale} next={next} email={typeof query.email === 'string' ? query.email : undefined} />
    </AuthShell>
  );
}
