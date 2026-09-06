import { apiFetch } from '@/lib/api';

interface CostRow {
  customerId: string;
  user: { id: string; email: string; name: string } | null;
  revenueCents: number;
  costCents: number;
  marginCents: number;
  totalTokens: number;
}

function centsToBRL(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function AdminCostsPage() {
  let rows: CostRow[] = [];
  try {
    const res = await apiFetch<{ data: CostRow[] }>('/v1/admin/costs');
    rows = res.data;
  } catch {
    rows = [];
  }

  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenueCents,
      cost: acc.cost + r.costCents,
      margin: acc.margin + r.marginCents,
      tokens: acc.tokens + r.totalTokens,
    }),
    { revenue: 0, cost: 0, margin: 0, tokens: 0 },
  );

  return (
    <div className="max-w-6xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight">Custos & Margem</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Últimos 30 dias · {rows.length} cliente{rows.length !== 1 ? 's' : ''} com uso
        </p>
      </header>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Receita</div>
          <div className="mt-1 font-mono text-2xl text-success">{centsToBRL(totals.revenue)}</div>
        </div>
        <div className="rounded-xl border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Custo</div>
          <div className="mt-1 font-mono text-2xl text-warn">{centsToBRL(totals.cost)}</div>
        </div>
        <div className="rounded-xl border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Margem</div>
          <div
            className={`mt-1 font-mono text-2xl ${
              totals.margin >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {centsToBRL(totals.margin)}
          </div>
        </div>
        <div className="rounded-xl border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Tokens</div>
          <div className="mt-1 font-mono text-2xl">
            {totals.tokens.toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 text-right">Receita</th>
              <th className="px-4 py-3 text-right">Custo</th>
              <th className="px-4 py-3 text-right">Margem</th>
              <th className="px-4 py-3 text-right">Tokens</th>
              <th className="px-4 py-3 text-right">Margem %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-fg-muted">
                  Sem dados ainda
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const marginPct = r.revenueCents > 0 ? (r.marginCents / r.revenueCents) * 100 : 0;
                return (
                  <tr key={r.customerId} className="border-t border-fg-muted/10">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.user?.name ?? '—'}</div>
                      <div className="text-xs text-fg-muted">{r.user?.email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {centsToBRL(r.revenueCents)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {centsToBRL(r.costCents)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-xs ${
                        r.marginCents >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {centsToBRL(r.marginCents)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {r.totalTokens.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {marginPct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
