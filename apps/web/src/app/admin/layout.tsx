import Link from 'next/link';
import { headers } from 'next/headers';
import { requireAdminSession } from '@/lib/api';
import { LogoutButton } from './_components/logout-button';

function NavItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`block rounded px-3 py-2 text-sm ${
        active
          ? 'bg-bg-subtle font-medium text-brasa-500'
          : 'text-fg-muted hover:bg-bg-subtle hover:text-fg'
      }`}
    >
      {children}
    </Link>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminSession();
  const h = await headers();
  const pathname = h.get('x-invoke-path') ?? h.get('x-pathname') ?? '/admin';
  const isActive = (href: string) =>
    href === '/admin'
      ? pathname === '/admin' || pathname === '/admin/'
      : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-fg-muted/15 bg-bg-panel/40 px-4 py-6 md:block">
        <Link href="/admin" className="block font-mono text-sm font-semibold text-accent">
          Consecom · Master
        </Link>
        <nav className="mt-8 space-y-1">
          <NavItem href="/admin" active={isActive('/admin')}>
            Dashboard
          </NavItem>
          <NavItem href="/admin/customers" active={isActive('/admin/customers')}>
            Clientes
          </NavItem>
          <NavItem href="/admin/plans" active={isActive('/admin/plans')}>
            Planos
          </NavItem>
          <NavItem href="/admin/models" active={isActive('/admin/models')}>
            Modelos
          </NavItem>
          <NavItem href="/admin/costs" active={isActive('/admin/costs')}>
            Custos
          </NavItem>
          <NavItem href="/admin/audit-logs" active={isActive('/admin/audit-logs')}>
            Audit
          </NavItem>
        </nav>

        <div className="absolute bottom-4 left-4 right-4 w-52">
          <div className="text-xs text-fg-muted">{admin.email}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-brasa-500">
            {admin.role}
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
