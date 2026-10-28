import { AuthShell } from '@/components/AuthShell';
import { safeNext } from '@/lib/routes';
import { getLocale } from '@/lib/server';
import { VerifyEmailLink } from './VerifyEmailLink';

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ next?: string | string[] }> };

/** Opened from the emailed sign-in link. */
export default async function EmailLinkLanding({ params, searchParams }: Props) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const locale = await getLocale();
  return (
    <AuthShell locale={locale}>
      <VerifyEmailLink locale={locale} token={token} next={safeNext(query.next)} />
    </AuthShell>
  );
}
