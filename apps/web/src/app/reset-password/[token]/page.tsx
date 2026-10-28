import { AuthShell } from '@/components/AuthShell';
import { getLocale } from '@/lib/server';
import { ResetForm } from './ResetForm';

/** Opened from the emailed link. Works whether or not someone is signed in on this browser. */
export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const locale = await getLocale();
  return (
    <AuthShell locale={locale}>
      <ResetForm locale={locale} token={token} />
    </AuthShell>
  );
}
