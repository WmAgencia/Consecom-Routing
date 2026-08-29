import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AuthResponse } from '@consecom/shared';

const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

/** Server-side fetch helper. Passes cookies to the API. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API ${status}: ${body}`);
  }
}

/** Ensure the user is logged in; otherwise redirect to /login. */
export async function requireSession(): Promise<AuthResponse['user']> {
  try {
    const me = await apiFetch<AuthResponse>('/v1/auth/me');
    return me.user;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect('/login');
    }
    throw err;
  }
}

/** Build absolute URL for server actions that fetch the API. */
export const API_BASE_URL = API_BASE;
