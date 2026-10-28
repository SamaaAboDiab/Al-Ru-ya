'use client';

import { useState } from 'react';
import type { Locale } from '@ruya/shared';
import { apiRequest, type ClientResult, type Method } from './client';
import { dictionaries } from './i18n';

/** Submits a form to the API and turns error codes into localized messages. */
export function useApiForm<T>(locale: Locale) {
  const t = dictionaries[locale];
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(path: string, body?: unknown, method: Method = 'POST'): Promise<ClientResult<T>> {
    setPending(true);
    setFormError(null);
    setFieldErrors({});
    const result = await apiRequest<T>(method, path, body);
    setPending(false);
    if (!result.ok) {
      const fields = Object.fromEntries(
        Object.entries(result.fields ?? {}).map(([k, code]) => [k, t.fieldErrors[code] ?? code]),
      );
      setFieldErrors(fields);
      setFormError(t.errors[result.code as keyof typeof t.errors] ?? t.errors.INTERNAL);
    }
    return result;
  }

  return { pending, formError, fieldErrors, submit };
}
