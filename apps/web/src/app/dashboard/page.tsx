import { requireSession, apiFetch } from '@/lib/api';
import type { AuthResponse, SubscriptionWithPlan } from '@consecom/shared';

interface UsageResponse {
  data: Array<{
    requestId: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    creditsConsumed: number;
    costCents: number;
    latencyMs: number;
    status: string;
    createdAt: string;
  }>;
  balance: { available: number; reserved: number; used: number };
}

export default async function DashboardHome() {
  const user = await requireSession();
  const [usage, sub] = await Promise.all([
    apiFetch<UsageResponse>('/v1/usage?limit=200').catch(() => ({
      data: [],
      balance: { available: 0, reserved: 0, used: 0 },
    })),
    apiFetch<SubscriptionWithPlan | null>('/v1/billing/plan').catch(() => null),
  ]);

  // Aggregate usage by day for the sparkline
  const byDay = new Map<string, number>();
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const e of usage.data) {
    const day = e.createdAt.slice(0, 10);
    if (byDay.has(day)) {
      byDay.set(day, (byDay.get(day) ?? 0) + e.totalTokens);
    }
  }
  const sparkData = Array.from(byDay.entries());

  const totalAvailable = usage.balance.available;
  const totalReserved = usage.balance.reserved;
  const totalUsed = usage.balance.used;
  const totalCapacity = totalAvailable + totalReserved + totalUsed;
  const usedPct = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold">Olá, {user.name}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {user.email} · {user.role}
        </p>
      </header>

      {/* Stats grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Plano"
          value={sub ? sub.plan.displayName : '—'}
          sub={sub ? `${sub.plan.code} · ${formatPlanStatus(sub.subscription)}` : 'sem assinatura ativa'}
        />
        <Stat
          label="Créditos disponíveis"
          value={totalAvailable.toLocaleString('pt-BR')}
          sub={`${usedPct}% utilizado`}
          tone={totalAvailable === 0 ? 'danger' : totalAvailable < totalCapacity * 0.2 ? 'warn' : 'ok'}
        />
        <Stat
          label="Requests (24h)"
          value={usage.data.length.toString()}
          sub={`${usage.data.reduce((s, e) => s + e.totalTokens, 0).toLocaleString('pt-BR')} tokens`}
        />
        <Stat
          label="Custo estimado"
          value={`$${(usage.data.reduce((s, e) => s + e.costCents, 0) / 100).toFixed(2)}`}
          sub={`${usage.data.filter((e) => e.status !== 'success').length} erros`}
        />
      </div>

      {/* Sparkline */}
      <section className="mt-8 rounded-lg border border-fg-muted/15 bg-bg-panel p-6">
        <h2 className="text-sm font-medium text-fg-muted">Tokens por dia (últimos 14)</h2>
        <Sparkline data={sparkData.map(([, v]) => v)} />
        <div className="mt-2 flex justify-between text-xs text-fg-muted">
          <span>{sparkData[0]?.[0] ?? ''}</span>
          <span>{sparkData[sparkData.length - 1]?.[0] ?? ''}</span>
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-fg-muted">Atividade recente</h2>
        <div className="overflow-hidden rounded-lg border border-fg-muted/15">
          <table className="w-full text-sm">
            <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
              <tr>
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Créditos</th>
                <th className="px-4 py-3">Latência</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {usage.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-fg-muted">
                    Nenhuma atividade ainda. Crie uma API Key e faça uma requisição.
                  </td>
                </tr>
              )}
              {usage.data.slice(0, 10).map((e) => (
                <tr key={e.requestId} className="border-t border-fg-muted/10">
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {new Date(e.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">{e.totalTokens.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3">{e.creditsConsumed.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3">{e.latencyMs}ms</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatPlanStatus(sub: { status: string; expiresAt: string }): string {
  if (sub.status !== 'active') return sub.status;
  const days = Math.max(
    0,
    Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / 86_400_000),
  );
  return days === 0 ? 'expira hoje' : `expira em ${days}d`;
}

function Stat({
  label,
  value,
  sub,
  tone = 'ok',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'ok' | 'warn' | 'danger';
}) {
  const accent =
    tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn' : 'text-fg';
  return (
    <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
      <div className="text-xs uppercase tracking-wide text-fg-muted">{label}</div>
      <div className={`mt-2 font-mono text-2xl ${accent}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-fg-muted">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'bg-success/15 text-success',
    error: 'bg-danger/15 text-danger',
    rate_limited: 'bg-warn/15 text-warn',
  };
  const cls = map[status] ?? 'bg-fg-muted/15 text-fg-muted';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const width = 100;
  const height = 30;
  const points = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width;
    const y = height - (v / max) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="mt-4 h-20 w-full"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#6366f1"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
