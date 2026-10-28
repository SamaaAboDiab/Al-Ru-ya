'use client';

import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Locale, SignInResultDTO } from '@ruya/shared';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries } from '@/lib/i18n';
import { homeFor } from '@/lib/routes';
import { useApiForm } from '@/lib/useApiForm';

type Props = { locale: Locale; token: string; next?: string };

/**
 * Spends the link only when the person taps Continue. Mail scanners open links, and some
 * run their scripts, to check them; signing in on load would let them use it up first.
 */
export function VerifyEmailLink({ locale, token, next }: Props) {
  const t = dictionaries[locale];
  const s = t.signin;
  const router = useRouter();
  const { pending, formError, submit } = useApiForm<SignInResultDTO>(locale);
  const carry = next ? `?next=${encodeURIComponent(next)}` : '';
  const [broken, setBroken] = useState(false);

  async function proceed() {
    const result = await submit('/api/auth/email-link/verify', { token });
    if (!result.ok) {
      // A mangled link fails validation rather than lookup; to the reader it is the same dead link.
      setBroken(result.code === 'LINK_INVALID' || Boolean(result.fields?.token));
      return;
    }
    if (result.data.status === 'signed-in') router.replace(next ?? homeFor(result.data.user.role));
    else router.replace(`/register/complete${carry}`);
    router.refresh();
  }

  return (
    <div className="auth-done">
      <span className="auth-done-icon auth-done-icon-info">
        <LogIn size={26} aria-hidden className="rtl-flip" />
      </span>
      <h1 className="auth-title">{s.continueTitle}</h1>
      <p className="auth-subtitle">{s.continueBody}</p>
      {formError && (
        <FormAlert>
          {broken ? t.errors.LINK_INVALID : formError} <Link href={`/login/link${carry}`}>{s.askAgain}</Link>
        </FormAlert>
      )}
      <SubmitButton type="button" className="btn btn-primary btn-lg btn-block" loading={pending} onClick={proceed}>
        {s.continue}
      </SubmitButton>
    </div>
  );
}
