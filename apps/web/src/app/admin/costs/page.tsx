import { cookies } from 'next/headers';
import { requireAdmin } from '../_lib';

const ADMIN_COOKIE = '__consecom_admin';

interface CostRow {
  customerId: string;
  user: { id: string; email: string; name: string };
  revenueCents: number;
  costCents: number;
  marginCents: number;
  totalTokens: number;
}

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

function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export default async function AdminCosts() {
  await requireAdmin();
  const data = await adminFetch<{ data: CostRow[] }>('/v1/admin/costs');

  const totalRevenue = data.data.reduce((s, r) => s + r.revenueCents, 0);
  const totalCost = data.data.reduce((s, r) => s + r.costCents, 0);
  const totalMargin = data.data.reduce((s, r) => s + r.marginCents, 0);
  const totalTokens = data.data.reduce((s, r) => s + r.totalTokens, 0);

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="text-2xl font-semibold">Custos</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Breakdown por customer • {data.data.length}{' '}
        {data.data.length === 1 ? 'cliente' : 'clientes'}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Receita</div>
          <div className="mt-2 font-mono text-2xl text-success">
            {formatCents(totalRevenue)}
          </div>
        </div>
        <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Custo API</div>
          <div className="mt-2 font-mono text-2xl text-danger">
            {formatCents(totalCost)}
          </div>
        </div>
        <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Margem</div>
          <div className="mt-2 font-mono text-2xl">{formatCents(totalMargin)}</div>
          <div className="mt-1 text-xs text-fg-muted">
            {totalRevenue > 0
              ? `${((totalMargin / totalRevenue) * 100).toFixed(1)}%`
              : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Tokens</div>
          <div className="mt-2 font-mono text-2xl">{totalTokens.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 text-right">Tokens</th>
              <th className="px-4 py-3 text-right">Receita</th>
              <th className="px-4 py-3 text-right">Custo</th>
              <th className="px-4 py-3 text-right">Margem</th>
              <th className="px-4 py-3 text-right">Margem %</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((row) => {
              const marginPct =
                row.revenueCents > 0
                  ? ((row.marginCents / row.revenueCents) * 100).toFixed(1)
                  : '—';
              return (
                <tr key={row.customerId} className="border-t border-fg-muted/10">
                  <td className="px-4 py-3">
                    <div className="text-sm">{row.user.name}</div>
                    <div className="font-mono text-xs text-fg-muted">
                      {row.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-success">
                    {formatCents(row.revenueCents)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-danger">
                    {formatCents(row.costCents)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCents(row.marginCents)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{marginPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
