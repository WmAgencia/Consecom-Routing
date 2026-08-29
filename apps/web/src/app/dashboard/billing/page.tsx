import { requireSession, apiFetch } from '@/lib/api';
import type { Plan, Subscription } from '@consecom/shared';
import { CheckoutButton } from './checkout-button';

interface SubscriptionWithPlan {
  subscription: Subscription;
  plan: Plan;
}
interface UsageResponse {
  balance: { available: number; reserved: number; used: number };
}

export default async function BillingPage() {
  await requireSession();
  const [sub, usage, plansRes] = await Promise.all([
    apiFetch<SubscriptionWithPlan | null>('/v1/billing/plan').catch(() => null),
    apiFetch<UsageResponse>('/v1/usage?limit=1').catch(() => ({
      balance: { available: 0, reserved: 0, used: 0 },
    })),
    apiFetch<{ data: Plan[] }>('/v1/billing/plans').catch(() => ({ data: [] })),
  ]);

  const b = usage.balance;
  const total = b.available + b.reserved + b.used;
  const usedPct = total > 0 ? Math.round((b.used / total) * 100) : 0;

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold">Assinatura</h1>
      </header>

      {sub ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-fg-muted">Plano atual</div>
                <div className="mt-1 text-2xl font-semibold">{sub.plan.displayName}</div>
                <div className="mt-1 font-mono text-xs text-fg-muted">
                  {sub.plan.code} · {sub.plan.rateLimitPerMin} req/min ·{' '}
                  {(sub.plan.credits / 1000).toFixed(0)}k créditos
                </div>
              </div>
              <span
                className={
                  sub.subscription.status === 'active'
                    ? 'rounded bg-success/15 px-3 py-1 text-xs text-success'
                    : 'rounded bg-fg-muted/15 px-3 py-1 text-xs text-fg-muted'
                }
              >
                {sub.subscription.status.toUpperCase()}
              </span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Field label="Início" value={new Date(sub.subscription.startedAt).toLocaleDateString('pt-BR')} />
              <Field label="Expira" value={new Date(sub.subscription.expiresAt).toLocaleDateString('pt-BR')} />
              <Field
                label="Dias restantes"
                value={String(
                  Math.max(
                    0,
                    Math.ceil(
                      (new Date(sub.subscription.expiresAt).getTime() - Date.now()) / 86_400_000,
                    ),
                  ),
                )}
              />
              <Field label="Modelos permitidos" value={sub.plan.modelsAllowed.length.toString()} />
            </dl>
          </div>

          <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-6">
            <h2 className="text-sm font-medium text-fg-muted">Consumo de créditos</h2>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl">{b.used.toLocaleString('pt-BR')}</span>
              <span className="text-fg-muted">/ {total.toLocaleString('pt-BR')}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full bg-accent"
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-fg-muted">
              <span>usados: {b.used.toLocaleString('pt-BR')}</span>
              <span>reservados: {b.reserved.toLocaleString('pt-BR')}</span>
              <span>disponíveis: {b.available.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-6 text-center">
            <h2 className="text-lg font-semibold">Você não tem assinatura ativa</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Escolha um plano abaixo para começar a usar a API.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {plansRes.data.map((p) => (
              <div key={p.id} className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
                <div className="text-xs uppercase tracking-wide text-fg-muted">{p.code}</div>
                <div className="mt-1 text-xl font-semibold">{p.displayName}</div>
                <div className="mt-1 font-mono text-2xl text-accent">
                  R${(p.priceCents / 100).toFixed(0)}
                </div>
                <div className="mt-1 text-xs text-fg-muted">
                  {p.durationDays} {p.durationDays === 1 ? 'dia' : 'dias'}
                </div>
                <ul className="mt-4 space-y-1 text-sm">
                  <li>{(p.credits / 1000).toFixed(0)}k créditos</li>
                  <li>{p.rateLimitPerMin} req/min</li>
                  <li>{p.modelsAllowed.length} modelos</li>
                </ul>
                <CheckoutButton planCode={p.code} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-fg-muted">{label}</div>
      <div className="mt-1 font-mono">{value}</div>
    </div>
  );
}
