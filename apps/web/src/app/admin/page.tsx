import Link from 'next/link';
import { cookies } from 'next/headers';
import { requireAdmin } from './_lib';

const ADMIN_COOKIE = '__consecom_admin';

async function adminFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE)?.value ?? '';
  const base = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${base}${path}`, {
    headers: { cookie: `${ADMIN_COOKIE}=${cookie}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

interface DashboardData {
  revenueCents: number;
  customersActive: number;
  requestsToday: number;
  costCents: number;
  marginCents: number;
  errorsToday: number;
  topModels: Array<{ model: string; totalTokens: number }>;
}

export default async function AdminHome() {
  await requireAdmin();
  const data = await adminFetch<DashboardData>('/v1/admin/dashboard');

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-fg-muted/15 bg-bg-panel/40 px-4 py-6">
        <Link href="/admin" className="block font-mono text-sm font-semibold text-accent">
          Master Panel
        </Link>
        <nav className="mt-8 space-y-1 text-sm">
          <NavItem href="/admin">Dashboard</NavItem>
          <NavItem href="/admin/customers">Clientes</NavItem>
          <NavItem href="/admin/plans">Planos</NavItem>
          <NavItem href="/admin/models">Modelos</NavItem>
          <NavItem href="/admin/costs">Custos</NavItem>
          <NavItem href="/admin/audit-logs">Audit Logs</NavItem>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="text-xs text-fg-muted hover:text-danger">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-6 py-8 md:px-10">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Consecom Routing</h1>
            <p className="mt-1 text-sm text-fg-muted">Visão geral operacional</p>
          </div>
          <div className="text-right text-xs text-fg-muted">{new Date().toLocaleString('pt-BR')}</div>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Receita hoje" value={formatBRL(data.revenueCents)} tone="success" />
          <Stat label="Clientes ativos" value={data.customersActive.toString()} />
          <Stat label="Requests hoje" value={data.requestsToday.toLocaleString('pt-BR')} />
          <Stat label="Custo estimado" value={formatBRL(data.costCents)} tone="warn" />
          <Stat label="Margem estimada" value={formatBRL(data.marginCents)} tone="success" />
          <Stat label="Erros hoje" value={data.errorsToday.toString()} tone={data.errorsToday > 0 ? 'danger' : 'ok'} />
        </div>

        <section className="mt-8 rounded-lg border border-fg-muted/15 bg-bg-panel p-6">
          <h2 className="text-sm font-medium text-fg-muted">Top modelos (7d, por tokens)</h2>
          <div className="mt-4 space-y-2">
            {data.topModels.length === 0 && (
              <div className="text-sm text-fg-muted">Sem dados ainda.</div>
            )}
            {data.topModels.map((m) => (
              <div key={m.model} className="flex items-center justify-between">
                <span className="font-mono text-sm">{m.model}</span>
                <span className="font-mono text-sm text-fg-muted">
                  {m.totalTokens.toLocaleString('pt-BR')} tokens
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
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

function Stat({
  label,
  value,
  tone = 'ok',
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'success' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warn'
        ? 'text-warn'
        : tone === 'danger'
          ? 'text-danger'
          : 'text-fg';
  return (
    <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
      <div className="text-xs uppercase tracking-wide text-fg-muted">{label}</div>
      <div className={`mt-2 font-mono text-2xl ${toneClass}`}>{value}</div>
    </div>
  );
}

function formatBRL(cents: number): string {
  return `R$${(cents / 100).toFixed(2)}`;
}
