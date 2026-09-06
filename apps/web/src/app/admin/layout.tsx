import Link from 'next/link';
import { headers } from 'next/headers';
import { requireAdminSession } from '@/lib/api';
import { LogoutButton } from './_components/logout-button';

function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded px-3 py-2 text-sm text-fg-muted hover:bg-bg-subtle hover:text-fg"
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

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-fg-muted/15 bg-bg-panel/40 px-4 py-6 md:block">
        <Link href="/admin" className="block font-mono text-sm font-semibold text-accent">
          Consecom · Master
        </Link>
        <nav className="mt-8 space-y-1">
          <NavItem href="/admin">Dashboard</NavItem>
          <NavItem href="/admin/customers">Clientes</NavItem>
          <NavItem href="/admin/plans">Planos</NavItem>
          <NavItem href="/admin/models">Modelos</NavItem>
          <NavItem href="/admin/costs">Custos</NavItem>
          <NavItem href="/admin/audit-logs">Audit</NavItem>
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
