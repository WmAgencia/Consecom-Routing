import { apiFetch } from '@/lib/api';
import { TogglePlanButton } from './_components/toggle-plan-button';

interface Plan {
  id: string;
  code: string;
  displayName: string;
  priceCents: number;
  durationHours: number;
  rateLimitPerMin: number;
  modelsAllowed: string[];
  active: boolean;
}

export default async function AdminPlansPage() {
  let plans: Plan[] = [];
  try {
    const res = await apiFetch<{ data: Plan[] }>('/v1/admin/plans');
    plans = res.data;
  } catch {
    plans = [];
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight">Planos</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {plans.length} plano{plans.length !== 1 ? 's' : ''} cadastrado{plans.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-fg-muted/15 bg-bg-panel p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-serif text-xl">{p.displayName}</div>
                <div className="font-mono text-xs text-fg-muted">{p.code}</div>
              </div>
              <TogglePlanButton planId={p.id} active={p.active} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs uppercase text-fg-muted">Preço</div>
                <div className="font-mono">R$ {(p.priceCents / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-fg-muted">Duração</div>
                <div className="font-mono">{p.durationHours}h</div>
              </div>
              <div>
                <div className="text-xs uppercase text-fg-muted">Rate Limit</div>
                <div className="font-mono">{p.rateLimitPerMin}/min</div>
              </div>
              <div>
                <div className="text-xs uppercase text-fg-muted">Modelos</div>
                <div className="font-mono">{p.modelsAllowed.length}</div>
              </div>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-fg-muted hover:text-fg">
                Ver modelos permitidos
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-xs text-fg-muted">
                {p.modelsAllowed.map((m) => (
                  <li key={m}>· {m}</li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
