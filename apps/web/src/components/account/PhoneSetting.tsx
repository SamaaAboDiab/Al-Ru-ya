'use client';

import { Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatEgyptMobile, type Locale, type UserDTO } from '@ruya/shared';
import { PhoneCodeForm } from '@/components/auth/PhoneCodeForm';
import { FormAlert } from '@/components/FormAlert';
import { dictionaries } from '@/lib/i18n';
import { useApiForm } from '@/lib/useApiForm';

/** Settings card: add, change or remove the mobile number used to sign in with a code. */
export function PhoneSetting({ locale, phone }: { locale: Locale; phone?: string }) {
  const t = dictionaries[locale];
  const p = t.phone;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const remove = useApiForm<UserDTO>(locale);

  async function unlink() {
    const result = await remove.submit('/api/auth/phone', undefined, 'DELETE');
    if (result.ok) router.refresh();
  }

  return (
    <section className="card stack">
      <h2 className="section-title">{p.settingsTitle}</h2>
      {editing ? (
        <PhoneCodeForm<UserDTO>
          locale={locale}
          verifyPath="/api/auth/phone/link"
          onVerified={() => {
            setEditing(false);
            router.refresh();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="phone-setting">
          <span className="phone-setting-icon">
            <Smartphone size={20} aria-hidden />
          </span>
          <div className="phone-setting-text">
            {phone ? (
              <bdi dir="ltr" className="phone-number">
                {formatEgyptMobile(phone)}
              </bdi>
            ) : (
              <span className="muted">{p.settingsHint}</span>
            )}
          </div>
          <div className="photo-setting-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              {phone ? p.change : p.add}
            </button>
            {phone && (
              <button type="button" className="btn btn-sm photo-setting-remove" onClick={unlink} disabled={remove.pending}>
                {p.remove}
              </button>
            )}
          </div>
        </div>
      )}
      {remove.formError && <FormAlert>{remove.formError}</FormAlert>}
    </section>
  );
}
