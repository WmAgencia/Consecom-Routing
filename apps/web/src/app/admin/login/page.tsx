import { redirect } from 'next/navigation';

// Legacy admin login route — redirects to unified /login with admin tab active.
export default function AdminLoginRedirect() {
  redirect('/login?type=admin');
}
