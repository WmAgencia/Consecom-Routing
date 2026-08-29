/**
 * Logout endpoint. Clears session cookies and redirects to /login.
 * The actual logout logic also lives at /v1/auth/logout on the API;
 * this is the form-action target so dashboard forms can use POST.
 */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('__consecom_session');
  cookieStore.delete('__consecom_refresh');
  cookieStore.delete('__consecom_csrf');
  return NextResponse.redirect(new URL('/login', 'http://localhost:3000'));
}
