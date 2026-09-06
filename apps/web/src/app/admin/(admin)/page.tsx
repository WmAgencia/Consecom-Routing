import { apiFetch } from '@/lib/api';

interface DashboardStats {
  revenueCents: number;
  customersActive: number;
  requestsToday: number;
  costCents: number;
  marginCents: number;
  errorsToday: number;
  topModels: Array<{ model: string; totalTokens: number }>;
}

function centsToBRL(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function AdminDashboardPage() {
  let stats: DashboardStats;
  try {
    stats = await apiFetch<DashboardStats>('/v1/admin/dashboard');
  } catch {
    stats = {
      revenueCents: 0,
      customersActive: 0,
      requestsToday: 0,
      costCents: 0,
      marginCents: 0,
      errorsToday: 0,
      topModels: [],
    };
  }

  const cards = [
    {
      label: 'Receita Hoje',
      value: centsToBRL(stats.revenueCents),
      color: 'text-success',
    },
    {
      label: 'Custo Hoje',
      value: centsToBRL(stats.costCents),
      color: 'text-warn',
    },
    {
      label: 'Margem Hoje',
      value: centsToBRL(stats.marginCents),
      color: stats.marginCents >= 0 ? 'text-success' : 'text-danger',
    },
    {
      label: 'Clientes Ativos',
      value: String(stats.customersActive),
      color: 'text-fg',
    },
    {
      label: 'Requisições Hoje',
      value: stats.requestsToday.toLocaleString('pt-BR'),
      color: 'text-fg',
    },
    {
      label: 'Erros Hoje',
      value: stats.errorsToday.toLocaleString('pt-BR'),
      color: stats.errorsToday > 0 ? 'text-danger' : 'text-fg',
    },
  ];

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight">Master Panel</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Visão geral do sistema em tempo real
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-fg-muted/15 bg-bg-panel p-6"
          >
            <div className="text-xs uppercase tracking-wide text-fg-muted">
              {c.label}
            </div>
            <div className={`mt-2 font-mono text-3xl ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          Top 5 Modelos (últimos 7 dias)
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-fg-muted/15">
          <table className="w-full text-sm">
            <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
              <tr>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3 text-right">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {stats.topModels.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-fg-muted">
                    Sem dados ainda
                  </td>
                </tr>
              ) : (
                stats.topModels.map((m) => (
                  <tr key={m.model} className="border-t border-fg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs">{m.model}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {m.totalTokens.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
