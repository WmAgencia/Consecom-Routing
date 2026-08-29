import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api';

const ADMIN_COOKIE = '__consecom_admin';

export async function requireAdmin(): Promise<{ email: string; role: string }> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE);
  if (!cookie) redirect('/admin/login');

  // Lightweight session check: ping a protected endpoint and see if it 200s.
  // We could decode the JWT here directly, but going through the API
  // ensures we fail closed if the cookie is invalid.
  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/dashboard`, {
      headers: { cookie: `${ADMIN_COOKIE}=${cookie.value}` },
      cache: 'no-store',
    });
    if (!res.ok) redirect('/admin/login');
    return { email: 'admin', role: 'admin' };
  } catch {
    redirect('/admin/login');
  }
}