import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_COOKIE = '__consecom_admin';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  return NextResponse.redirect(new URL('/admin/login', 'http://localhost:3000'));
}