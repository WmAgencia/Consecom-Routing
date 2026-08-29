import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Dashboard — Consecom Routing',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-fg-muted/15 bg-bg-panel/40 px-4 py-6 md:block">
        <Link href="/dashboard" className="block font-mono text-sm font-semibold text-accent">
          Consecom Routing
        </Link>
        <nav className="mt-8 space-y-1 text-sm">
          <NavItem href="/dashboard">Dashboard</NavItem>
          <NavItem href="/dashboard/api-keys">API Keys</NavItem>
          <NavItem href="/dashboard/models">Modelos</NavItem>
          <NavItem href="/dashboard/usage">Uso</NavItem>
          <NavItem href="/dashboard/billing">Assinatura</NavItem>
          <NavItem href="/dashboard/settings">Configurações</NavItem>
          <NavItem href="/docs">Documentação</NavItem>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-fg-muted">{user.email}</div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="mt-2 text-xs text-fg-muted hover:text-danger"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded px-3 py-2 text-fg-muted hover:bg-bg-subtle hover:text-fg"
    >
      {children}
    </Link>
  );
}
