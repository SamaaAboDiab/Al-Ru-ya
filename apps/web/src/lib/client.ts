import type { ApiResponse } from '@ruya/shared';

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; fields?: Record<string, string> };

export type Method = 'POST' | 'PUT' | 'DELETE';

/** Browser-side API call through the same-origin /api rewrite. */
export async function apiRequest<T>(method: Method, path: string, body?: unknown): Promise<ClientResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    return { ok: false, code: 'NETWORK' };
  }
  if (res.status === 204) return { ok: true, data: undefined as T };
  try {
    const json = (await res.json()) as ApiResponse<T>;
    return json.success
      ? { ok: true, data: json.data }
      : { ok: false, code: json.error.code, fields: json.error.fields };
  } catch {
    return { ok: false, code: 'INTERNAL' };
  }
}

export const apiPost = <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, body);
