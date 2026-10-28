'use client';

import { useRouter } from 'next/navigation';
import type { Locale, SignInResultDTO } from '@ruya/shared';
import { PhoneCodeForm } from '@/components/auth/PhoneCodeForm';
import { homeFor } from '@/lib/routes';

export function PhoneSignIn({ locale, next }: { locale: Locale; next?: string }) {
  const router = useRouter();
  return (
    <PhoneCodeForm<SignInResultDTO>
      locale={locale}
      verifyPath="/api/auth/phone/verify"
      onVerified={(result) => {
        if (result.status === 'signed-in') router.replace(next ?? homeFor(result.user.role));
        else router.replace(`/register/complete${next ? `?next=${encodeURIComponent(next)}` : ''}`);
        router.refresh();
      }}
    />
  );
}
