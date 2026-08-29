import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireAdmin } from '../../_lib';
import Link from 'next/link';
import { ActivatePlanForm, CreateKeyForCustomerButton, RevokeKeyButton } from './client-actions';

const ADMIN_COOKIE = '__consecom_admin';

interface CustomerDetail {
  user: { id: string; email: string; name: string; status: string; createdAt: string };
  customer: { status: string } | null;
  balance: { creditsAvailable: number; creditsReserved: number; creditsUsed: number } | null;
  subscription:
    | { id: string; status: string; startedAt: string; expiresAt: string; planId: string }
    | null;
  plan:
    | { id: string; code: string; displayName: string; priceCents: number; credits: number; durationDays: number }
    | null;
  apiKeys: Array<{ id: string; name: string; keyPrefix: string; status: string; requestCount: number }>;
  recentUsage: Array<{
    requestId: string;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    creditsConsumed: number;
    costCents: number;
    status: string;
    createdAt: string;
  }>;
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

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const data = await adminFetch<CustomerDetail>(`/v1/admin/customers/${id}`);

  if (!data.user) notFound();

  const totalCredits =
    (data.balance?.creditsAvailable ?? 0) +
    (data.balance?.creditsReserved ?? 0) +
    (data.balance?.creditsUsed ?? 0);

  const sub = data.subscription;
  const plan = data.plan;
  const subIsActive = sub?.status === 'active' && new Date(sub.expiresAt) > new Date();

  return (
    <div className="px-6 py-8 md:px-10">
      <Link href="/admin/customers" className="text-sm text-fg-muted hover:text-fg">
        ← Clientes
      </Link>
      <header className="mt-4">
        <h1 className="text-2xl font-semibold">{data.user.name}</h1>
        <div className="mt-1 font-mono text-xs text-fg-muted">{data.user.email}</div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase text-fg-muted">Créditos</div>
          <div className="mt-1 font-mono text-xl">{data.balance?.creditsAvailable ?? 0}</div>
          <div className="mt-1 text-xs text-fg-muted">
            reservados: {data.balance?.creditsReserved ?? 0} · usados: {data.balance?.creditsUsed ?? 0} ·
            total: {totalCredits}
          </div>
        </div>
        <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase text-fg-muted">Status</div>
          <div className="mt-1 font-mono text-xl">{data.user.status}</div>
          <div className="mt-1 text-xs text-fg-muted">
            criado: {new Date(data.user.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
        <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
          <div className="text-xs uppercase text-fg-muted">API Keys</div>
          <div className="mt-1 font-mono text-xl">{data.apiKeys.length}</div>
        </div>
      </div>

      {/* Plano & Subscription */}
      <section className="mt-8 rounded-lg border border-fg-muted/15 bg-bg-panel p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium text-fg-muted">Plano &amp; Subscription</h2>
            <div className="mt-2 text-lg">
              {sub && plan ? (
                <>
                  <div className="font-semibold">{plan.displayName}</div>
                  <div className="mt-1 text-xs text-fg-muted">
                    código: {plan.code} · status:{' '}
                    <span className={subIsActive ? 'text-success' : 'text-danger'}>
                      {sub.status}
                    </span>{' '}
                    · expira: {new Date(sub.expiresAt).toLocaleDateString('pt-BR')} ·
                    início: {new Date(sub.startedAt).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="mt-1 text-xs text-fg-muted">
                    R${(plan.priceCents / 100).toFixed(2)} · {plan.credits.toLocaleString('pt-BR')} créditos ·{' '}
                    {plan.durationDays} dias
                  </div>
                </>
              ) : (
                <div className="text-sm text-fg-muted">Sem assinatura ativa.</div>
              )}
            </div>
          </div>
          <ActivatePlanForm customerId={data.user.id} />
        </div>
      </section>

      {/* API Keys */}
      <section className="mt-8 rounded-lg border border-fg-muted/15 bg-bg-panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg-muted">API Keys</h2>
          <CreateKeyForCustomerButton customerId={data.user.id} />
        </div>
        <div className="mt-4 space-y-2">
          {data.apiKeys.length === 0 && (
            <div className="text-sm text-fg-muted">Nenhuma key.</div>
          )}
          {data.apiKeys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between border-t border-fg-muted/10 pt-2"
            >
              <div>
                <div className="font-medium">{k.name}</div>
                <div className="font-mono text-xs text-fg-muted">{k.keyPrefix}••••••••</div>
              </div>
              <div className="flex items-center gap-4 text-right text-xs">
                <div>
                  <div>{k.status}</div>
                  <div className="text-fg-muted">{k.requestCount.toLocaleString('pt-BR')} reqs</div>
                </div>
                {k.status === 'active' && <RevokeKeyButton keyId={k.id} keyPrefix={k.keyPrefix} />}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-fg-muted/15 bg-bg-panel p-6">
        <h2 className="text-sm font-medium text-fg-muted">Uso recente</h2>
        <div className="mt-4 overflow-hidden rounded border border-fg-muted/10">
          <table className="w-full text-sm">
            <thead className="bg-bg-panel/80 text-left text-xs uppercase text-fg-muted">
              <tr>
                <th className="px-3 py-2">Request</th>
                <th className="px-3 py-2">Tokens</th>
                <th className="px-3 py-2">Créditos</th>
                <th className="px-3 py-2">Custo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Quando</th>
              </tr>
            </thead>
            <tbody>
              {data.recentUsage.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-fg-muted">
                    Sem uso ainda.
                  </td>
                </tr>
              )}
              {data.recentUsage.slice(0, 20).map((u) => (
                <tr key={u.requestId} className="border-t border-fg-muted/10">
                  <td className="px-3 py-2 font-mono text-xs">{u.requestId.slice(0, 12)}…</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {(u.inputTokens + u.outputTokens).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{u.creditsConsumed}</td>
                  <td className="px-3 py-2 font-mono text-xs">${(u.costCents / 100).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">{u.status}</td>
                  <td className="px-3 py-2 font-mono text-xs text-fg-muted">
                    {new Date(u.createdAt).toLocaleString('pt-BR')}
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