import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { homeFor } from '@/lib/routes';
import { getCurrentUser, getLocale } from '@/lib/server';
import { ForgotForm } from './ForgotForm';

type SearchParams = Promise<{ email?: string | string[] }>;

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  const locale = await getLocale();
  const { email } = await searchParams;
  return (
    <AuthShell locale={locale}>
      <ForgotForm locale={locale} email={typeof email === 'string' ? email : undefined} />
    </AuthShell>
  );
}
