import { requireSession, apiFetch } from '@/lib/api';
import type { SubscriptionWithPlan } from '@consecom/shared';

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
    model: string;
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

  const successRate =
    usage.data.length > 0
      ? Math.round((usage.data.filter((e) => e.status === 'success').length / usage.data.length) * 100)
      : 100;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header className="animate-fade-up">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-fg-muted">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          Online
        </div>
        <h1 className="mt-2 font-serif text-3xl text-fg">
          Olá, <span className="text-accent">{user.name?.split(' ')[0] ?? user.email}</span>
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {user.email} · {user.role === 'superadmin' ? 'Super admin' : 'Conta ativa'}
        </p>
      </header>

      {/* Stats grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Plano atual"
          value={sub ? sub.plan.displayName : '—'}
          sub={sub ? `${sub.plan.code} · ${formatPlanStatus(sub.subscription)}` : 'sem assinatura ativa'}
          icon={<CrownIcon className="h-5 w-5" />}
          gradient="from-brasa-500/20 to-brasa-700/5"
        />
        <StatCard
          label="Créditos disponíveis"
          value={totalAvailable.toLocaleString('pt-BR')}
          sub={`${usedPct}% utilizado do total`}
          tone={totalAvailable === 0 ? 'danger' : totalAvailable < totalCapacity * 0.2 ? 'warn' : 'ok'}
          icon={<CoinsIcon className="h-5 w-5" />}
          gradient="from-success/15 to-success/5"
        />
        <StatCard
          label="Requisições (24h)"
          value={usage.data.length.toString()}
          sub={`${usage.data.reduce((s, e) => s + e.totalTokens, 0).toLocaleString('pt-BR')} tokens processados`}
          icon={<BoltIcon className="h-5 w-5" />}
          gradient="from-warn/15 to-warn/5"
        />
        <StatCard
          label="Taxa de sucesso"
          value={`${successRate}%`}
          sub={`${usage.data.filter((e) => e.status !== 'success').length} erros no total`}
          tone={successRate >= 95 ? 'ok' : successRate >= 80 ? 'warn' : 'danger'}
          icon={<CheckIcon className="h-5 w-5" />}
          gradient="from-accent/15 to-accent/5"
        />
      </section>

      {/* Usage sparkline */}
      <section className="animate-fade-up rounded-2xl border border-white/5 bg-bg-panel/60 p-6 backdrop-blur-xl" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-fg">Uso de tokens</h2>
            <p className="text-xs text-fg-muted">Últimos 14 dias</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl text-accent">
              {usage.data.reduce((s, e) => s + e.totalTokens, 0).toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-fg-muted">tokens totais</div>
          </div>
        </div>
        <Sparkline data={sparkData.map(([, v]) => v)} />
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-fg-muted">
          <span>{formatDay(sparkData[0]?.[0])}</span>
          <span>hoje</span>
        </div>
      </section>

      {/* Recent activity */}
      <section className="animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg">Atividade recente</h2>
          <a href="/dashboard/usage" className="text-xs text-accent hover:underline">
            Ver tudo →
          </a>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-bg-panel/40 backdrop-blur-xl">
          {usage.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle">
                <BoltIcon className="h-6 w-6 text-fg-muted" />
              </div>
              <p className="text-sm text-fg-muted">
                Nenhuma atividade ainda. Crie uma API Key e faça uma requisição.
              </p>
              <a
                href="/dashboard/api-keys"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white shadow-glow transition hover:bg-accent-hover"
              >
                <KeyIcon className="h-3.5 w-3.5" />
                Criar API Key
              </a>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-left text-[10px] uppercase tracking-widest text-fg-muted">
                <tr>
                  <th className="px-4 py-3">Quando</th>
                  <th className="px-4 py-3">Modelo</th>
                  <th className="px-4 py-3">Tokens</th>
                  <th className="px-4 py-3">Latência</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {usage.data.slice(0, 10).map((e) => (
                  <tr key={e.requestId} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                      {new Date(e.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded-md bg-bg-subtle px-2 py-0.5 text-xs">{e.model ?? '—'}</code>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{e.totalTokens.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">{e.latencyMs}ms</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

function formatDay(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function StatCard({
  label,
  value,
  sub,
  tone = 'ok',
  icon,
  gradient,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'ok' | 'warn' | 'danger';
  icon: React.ReactNode;
  gradient: string;
}) {
  const toneColor =
    tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn' : 'text-fg';
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-bg-panel/60 p-5 backdrop-blur-xl transition hover:border-white/10">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 transition group-hover:opacity-100`} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="text-[10px] uppercase tracking-widest text-fg-muted">{label}</div>
          <div className="text-fg-muted">{icon}</div>
        </div>
        <div className={`mt-3 font-serif text-2xl ${toneColor}`}>{value}</div>
        {sub && <div className="mt-1 text-xs text-fg-muted">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    success: { bg: 'bg-success/15', fg: 'text-success', label: 'OK' },
    error: { bg: 'bg-danger/15', fg: 'text-danger', label: 'Erro' },
    rate_limited: { bg: 'bg-warn/15', fg: 'text-warn', label: 'Rate limit' },
  };
  const s = map[status] ?? { bg: 'bg-fg-muted/15', fg: 'text-fg-muted', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${s.bg} ${s.fg} px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.fg.replace('text-', 'bg-')}`} />
      {s.label}
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
  const areaPoints = `0,${height} ${points.join(' ')} ${width},${height}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="mt-6 h-24 w-full"
    >
      <defs>
        <linearGradient id="sparklineFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E85D1F" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#E85D1F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparklineFill)" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#E85D1F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ── Icons ──────────────────────────────────────────────
function CrownIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18h18M5 18l1.5-9 4 5 3-7 3 7 4-5L21 18" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function CoinsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1010.37 18.09M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function BoltIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function KeyIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="15" r="4" /><path d="M10.85 12.15L19 4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
