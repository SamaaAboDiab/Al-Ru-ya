'use client';

import { Camera, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import type { Locale } from '@ruya/shared';
import { Avatar } from '@/components/Avatar';
import { FormAlert } from '@/components/FormAlert';
import { apiRequest } from '@/lib/client';
import { dictionaries } from '@/lib/i18n';

const SIZE = 320;

/** Crops the middle square and scales it down, so uploads stay small whatever the camera produced. */
async function toSquare(file: File): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();

  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  // Browsers that can't write WebP silently hand back a PNG, which is far larger; JPEG then.
  const webp = await encode('image/webp');
  return webp?.type === 'image/webp' ? webp : encode('image/jpeg');
}

type Props = { locale: Locale; user: { id: string; name: string; photoUrl?: string }; isChild: boolean };

/** Settings card for the profile photo: add, change or remove it. */
export function ProfilePhoto({ locale, user, isChild }: Props) {
  const t = dictionaries[locale];
  const a = t.account;
  const router = useRouter();
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photo = preview ?? user.photoUrl;
  const pickLabel = photo ? a.photoChange : a.photoAdd;

  const fail = (code: string) => setError(t.errors[code as keyof typeof t.errors] ?? t.errors.INTERNAL);

  async function upload(file: File) {
    setError(null);
    const blob = await toSquare(file);
    if (!blob) return fail('PHOTO_INVALID');
    const local = URL.createObjectURL(blob);
    setPreview(local);
    setBusy(true);
    const result = await apiRequest<{ photoUrl: string }>('PUT', '/api/users/me/photo', blob);
    setBusy(false);
    if (!result.ok) {
      setPreview(null);
      URL.revokeObjectURL(local);
      return fail(result.code);
    }
    router.refresh();
  }

  async function remove() {
    setError(null);
    setBusy(true);
    const result = await apiRequest<void>('DELETE', '/api/users/me/photo');
    setBusy(false);
    if (!result.ok) return fail(result.code);
    setPreview(null);
    router.refresh();
  }

  return (
    <section className="card stack">
      <h2 className="section-title">{a.photoTitle}</h2>
      <div className="photo-setting">
        <div className="profile-photo-frame" data-busy={busy || undefined}>
          <Avatar name={user.name} id={user.id} photo={photo} size="xl" />
          <label htmlFor={inputId} className="profile-photo-btn" title={pickLabel}>
            {busy ? <span className="spinner" aria-hidden /> : <Camera size={18} aria-hidden />}
            <span className="visually-hidden">{pickLabel}</span>
          </label>
        </div>

        <div className="photo-setting-text">
          <p className="muted">{a.photoHint(isChild)}</p>
          <div className="photo-setting-actions">
            {/* A label opens the file picker, so the visible button needs no script. */}
            <label htmlFor={inputId} className="btn btn-secondary btn-sm" aria-disabled={busy || undefined}>
              <Camera size={16} aria-hidden />
              {busy ? a.photoSaving : pickLabel}
            </label>
            {user.photoUrl && !busy && (
              <button type="button" className="btn btn-sm photo-setting-remove" onClick={remove}>
                <Trash2 size={16} aria-hidden />
                {a.photoRemove}
              </button>
            )}
          </div>
        </div>

        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="visually-hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void upload(file);
          }}
        />
      </div>
      {busy && (
        <span className="visually-hidden" role="status">
          {a.photoSaving}
        </span>
      )}
      {error && <FormAlert>{error}</FormAlert>}
    </section>
  );
}
