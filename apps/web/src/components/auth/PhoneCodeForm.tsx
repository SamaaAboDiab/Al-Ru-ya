'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { PHONE_CODE_RESEND_SECONDS, formatEgyptMobile, normalizeEgyptMobile, type Locale } from '@ruya/shared';
import { Field } from '@/components/Field';
import { FormAlert } from '@/components/FormAlert';
import { SubmitButton } from '@/components/SubmitButton';
import { dictionaries, formatNumber } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

type Props<T> = {
  locale: Locale;
  /** Where the code is checked: signing in, or adding the number to the signed-in account. */
  verifyPath: string;
  onVerified: (data: T) => void;
  /** Adds a cancel button under the number step (used in settings). */
  onCancel?: () => void;
};

/** Two steps: the mobile number, then the 6-digit code texted to it, with a timed resend. */
export function PhoneCodeForm<T>({ locale, verifyPath, onVerified, onCancel }: Props<T>) {
  const t = dictionaries[locale];
  const p = t.phone;
  const send = useApiForm<void>(locale);
  const verify = useApiForm<T>(locale);
  const [phone, setPhone] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function sendCode(number: string) {
    const result = await send.submit('/api/auth/phone/send', { phone: number, locale });
    if (result.ok) {
      setPhone(normalizeEgyptMobile(number) ?? number);
      setWait(PHONE_CODE_RESEND_SECONDS);
    }
  }

  async function onNumber(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await sendCode(String(new FormData(e.currentTarget).get('phone') ?? ''));
  }

  async function onCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await verify.submit(verifyPath, { phone, code: new FormData(e.currentTarget).get('code') });
    if (result.ok) onVerified(result.data);
  }

  if (!phone) {
    return (
      <form className="form" onSubmit={onNumber} noValidate>
        {send.formError && !send.fieldErrors.phone && <FormAlert>{send.formError}</FormAlert>}
        <Field
          label={p.label}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="010 1234 5678"
          dir="ltr"
          required
          autoFocus
          error={send.fieldErrors.phone}
        />
        <SubmitButton className="btn btn-primary btn-lg btn-block" loading={send.pending}>
          {p.send}
        </SubmitButton>
        {onCancel && (
          <button type="button" className="btn btn-secondary btn-block" onClick={onCancel}>
            {p.cancel}
          </button>
        )}
      </form>
    );
  }

  return (
    <form className="form" onSubmit={onCode} noValidate>
      <p className="phone-sent">
        {p.codeSent}{' '}
        <bdi dir="ltr" className="phone-number">
          {formatEgyptMobile(phone)}
        </bdi>
      </p>
      {(verify.formError || send.formError) && !verify.fieldErrors.code && (
        <FormAlert>{verify.formError ?? send.formError}</FormAlert>
      )}
      <Field
        label={p.codeLabel}
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="••••••"
        maxLength={7}
        dir="ltr"
        required
        autoFocus
        className="code-input"
        error={verify.fieldErrors.code}
      />
      <SubmitButton className="btn btn-primary btn-lg btn-block" loading={verify.pending}>
        {p.verify}
      </SubmitButton>
      <div className="phone-actions">
        {wait > 0 ? (
          <span className="muted">{p.resendIn(formatNumber(wait, locale))}</span>
        ) : (
          <button type="button" className="link-btn" onClick={() => sendCode(phone)} disabled={send.pending}>
            {p.resend}
          </button>
        )}
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setPhone(null);
            setWait(0);
          }}
        >
          {p.changeNumber}
        </button>
      </div>
    </form>
  );
}
