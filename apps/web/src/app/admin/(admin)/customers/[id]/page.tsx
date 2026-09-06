import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { ToggleStatusButton } from './_components/toggle-status-button';
import { ActivatePlanButton } from './_components/activate-plan-button';
import { CreateKeyButton } from './_components/create-key-button';
import { RevokeKeyButton } from './_components/revoke-key-button';
import { AdjustCreditsButton } from './_components/adjust-credits-button';

interface CustomerDetail {
  user: { id: string; email: string; name: string; status: string; createdAt: string };
  customer: { id: string; status: string; rateLimitOverride: number | null; notes: string | null };
  balance: { creditsAvailable: number; creditsReserved: number; creditsUsed: number } | null;
  subscription: {
    id: string;
    status: string;
    startedAt: string;
    expiresAt: string;
  } | null;
  plan: { code: string; displayName: string; priceCents: number; durationHours: number } | null;
  apiKeys: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    status: string;
    createdAt: string;
    requestCount: number;
  }>;
  recentUsage: Array<{
    requestId: string;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    creditsConsumed: number;
    costCents: number;
    latencyMs: number;
    status: string;
    createdAt: string;
  }>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expirado';
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h restantes`;
  return `${hours}h restantes`;
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail: CustomerDetail;
  try {
    detail = await apiFetch<CustomerDetail>(`/v1/admin/customers/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-fg-muted">Cliente</div>
          <h1 className="font-serif text-3xl tracking-tight">{detail.user.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-sm text-fg-muted">{detail.user.email}</span>
            <span
              className={
                detail.customer.status === 'active'
                  ? 'rounded bg-success/15 px-2 py-0.5 text-xs text-success'
                  : 'rounded bg-warn/15 px-2 py-0.5 text-xs text-warn'
              }
            >
              {detail.customer.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <ToggleStatusButton customerId={id} currentStatus={detail.customer.status} />
          <AdjustCreditsButton customerId={id} />
          <ActivatePlanButton customerId={id} />
        </div>
      </header>

      {/* Subscription + balance summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-fg-muted/15 bg-bg-panel p-6">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Plano Atual</div>
          {detail.plan ? (
            <>
              <div className="mt-2 font-serif text-xl">{detail.plan.displayName}</div>
              <div className="mt-1 font-mono text-xs text-fg-muted">
                R$ {(detail.plan.priceCents / 100).toFixed(2)} · {detail.plan.durationHours}h
              </div>
              {detail.subscription ? (
                <div className="mt-3 text-xs">
                  <div>
                    Status:{' '}
                    <span
                      className={
                        detail.subscription.status === 'active'
                          ? 'text-success'
                          : 'text-warn'
                      }
                    >
                      {detail.subscription.status}
                    </span>
                  </div>
                  <div className="text-fg-muted">
                    {formatRemaining(detail.subscription.expiresAt)}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-warn">Sem subscription</div>
              )}
            </>
          ) : (
            <div className="mt-2 text-sm text-fg-muted">Nenhum plano ativo</div>
          )}
        </div>

        <div className="rounded-xl border border-fg-muted/15 bg-bg-panel p-6">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Créditos</div>
          <div className="mt-2 font-mono text-3xl">
            {(detail.balance?.creditsAvailable ?? 0).toLocaleString('pt-BR')}
          </div>
          <div className="mt-1 text-xs text-fg-muted">
            disponíveis · {(detail.balance?.creditsReserved ?? 0).toLocaleString('pt-BR')} reservados ·{' '}
            {(detail.balance?.creditsUsed ?? 0).toLocaleString('pt-BR')} usados
          </div>
        </div>
      </div>

      {/* API Keys */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
            API Keys
          </h2>
          <CreateKeyButton customerId={id} />
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-fg-muted/15">
          <table className="w-full text-sm">
            <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Prefixo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Criada</th>
                <th className="px-4 py-3 text-right">Requisições</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {detail.apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-fg-muted">
                    Nenhuma key criada
                  </td>
                </tr>
              ) : (
                detail.apiKeys.map((k) => (
                  <tr key={k.id} className="border-t border-fg-muted/10">
                    <td className="px-4 py-3">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{k.keyPrefix}…</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          k.status === 'active'
                            ? 'rounded bg-success/15 px-2 py-0.5 text-xs text-success'
                            : 'rounded bg-danger/15 px-2 py-0.5 text-xs text-danger'
                        }
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                      {formatDate(k.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {k.requestCount.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {k.status === 'active' && <RevokeKeyButton keyId={k.id} />}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent usage */}
      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          Uso Recente (últimas 50)
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-fg-muted/15">
          <table className="w-full text-sm">
            <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Tokens</th>
                <th className="px-4 py-3 text-right">Custo</th>
                <th className="px-4 py-3 text-right">Latência</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.recentUsage.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-fg-muted">
                    Sem uso registrado
                  </td>
                </tr>
              ) : (
                detail.recentUsage.map((u) => (
                  <tr key={u.requestId} className="border-t border-fg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {(u.inputTokens + u.outputTokens).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      R$ {(u.costCents / 100).toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {u.latencyMs}ms
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.status === 'success'
                            ? 'rounded bg-success/15 px-2 py-0.5 text-xs text-success'
                            : 'rounded bg-danger/15 px-2 py-0.5 text-xs text-danger'
                        }
                      >
                        {u.status}
                      </span>
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
