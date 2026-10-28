import { Mail, Smartphone } from 'lucide-react';
import Link from 'next/link';
import type { AuthMethodsDTO, Locale } from '@ruya/shared';
import { dictionaries } from '@/lib/i18n';
import { GoogleMark } from './GoogleMark';

/**
 * The ways in besides email and password. Google and phone appear only once the server
 * has them set up, so nobody meets a button that can't work.
 */
export function OtherSignIn({ locale, methods, next }: { locale: Locale; methods: AuthMethodsDTO | null; next?: string }) {
  const t = dictionaries[locale].signin;
  const carry = next ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <div className="other-signin">
      <div className="other-signin-divider">
        <span>{t.or}</span>
      </div>
      {methods?.google && (
        // A full page load: the browser must leave for Google and come back.
        <a href={`/api/auth/google/start${carry}`} className="btn btn-secondary btn-block other-signin-btn">
          <GoogleMark />
          {t.withGoogle}
        </a>
      )}
      {methods?.phone && (
        <Link href={`/login/phone${carry}`} className="btn btn-secondary btn-block other-signin-btn">
          <Smartphone size={18} aria-hidden />
          {t.withPhone}
        </Link>
      )}
      <Link href={`/login/link${carry}`} className="btn btn-secondary btn-block other-signin-btn">
        <Mail size={18} aria-hidden />
        {t.withLink}
      </Link>
    </div>
  );
}
