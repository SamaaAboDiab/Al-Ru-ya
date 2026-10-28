'use client';

import { useRouter } from 'next/navigation';
import type { ChildDTO, Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

export function AcceptInviteButton({ locale, token }: { locale: Locale; token: string }) {
  const router = useRouter();
  const { pending, formError, submit } = useApiForm<ChildDTO>(locale);

  async function accept() {
    const result = await submit(`/api/invitations/${encodeURIComponent(token)}/accept`, {});
    if (result.ok) {
      router.replace('/parent');
      router.refresh();
    }
  }

  return (
    <div className="stack">
      {formError && <p className="alert alert-error" role="alert">{formError}</p>}
      <button type="button" className="btn btn-primary" onClick={accept} disabled={pending}>
        {dictionaries[locale].invitePage.accept}
      </button>
    </div>
  );
}
