import { cookies } from 'next/headers';
import { requireAdmin } from '../_lib';

const ADMIN_COOKIE = '__consecom_admin';

interface PlanRow {
  id: string;
  code: string;
  displayName: string;
  priceCents: number;
  priceDisplay: string;
  durationHours: number;
  durationDays: number;
  rateLimitPerMin: number;
  modelsAllowed: string[];
  active: boolean;
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

export default async function AdminPlans() {
  await requireAdmin();
  const data = await adminFetch<{ data: PlanRow[] }>('/v1/admin/plans');

  const fmt = (cents: number) =>
    cents === 0 ? 'Grátis' : `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="text-2xl font-semibold">Planos</h1>
      <p className="mt-1 text-sm text-fg-muted">
        {data.data.length} {data.data.length === 1 ? 'plano cadastrado' : 'planos cadastrados'}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.data.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg border bg-bg-panel p-5 ${
              plan.active ? 'border-fg-muted/15' : 'border-danger/40 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-xs uppercase text-fg-muted">{plan.code}</div>
                <div className="mt-1 text-lg font-semibold">{plan.displayName}</div>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  plan.active
                    ? 'bg-success/15 text-success'
                    : 'bg-danger/15 text-danger'
                }`}
              >
                {plan.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="mt-4 font-mono text-2xl">{fmt(plan.priceCents)}</div>
            <div className="mt-1 text-xs text-fg-muted">
              {plan.durationDays === 1 ? '24 horas' : `${plan.durationDays} dias`} • {plan.rateLimitPerMin} req/min
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {plan.modelsAllowed.slice(0, 4).map((m) => (
                <span
                  key={m}
                  className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-muted"
                >
                  {m.replace('claude-', '')}
                </span>
              ))}
              {plan.modelsAllowed.length > 4 && (
                <span className="text-[10px] text-fg-muted">
                  +{plan.modelsAllowed.length - 4}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
