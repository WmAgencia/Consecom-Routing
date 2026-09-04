'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  code: string;
  displayName: string;
  priceCents: number;
  durationHours: number;
  active: boolean;
}

export function ActivatePlanButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planCode, setPlanCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/v1/admin/plans', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setPlans((d.data ?? []).filter((p: Plan) => p.active)))
      .catch(() => setPlans([]));
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/v1/admin/customers/${customerId}/activate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planCode }),
      });
      if (!res.ok) {
        setError(await res.text());
        setLoading(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-brasa-500 px-4 py-2 text-xs font-medium text-white hover:bg-brasa-600"
      >
        Ativar Plano
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-3 rounded-xl border border-fg-muted/20 bg-bg-panel p-6"
          >
            <h2 className="font-serif text-xl">Ativar Plano</h2>
            <p className="text-xs text-fg-muted">
              Substitui a subscription atual. A duração começa agora.
            </p>

            <select
              required
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              className="mt-2 w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm"
            >
              <option value="">— escolha um plano —</option>
              {plans.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.displayName} · R$ {(p.priceCents / 100).toFixed(2)} · {p.durationHours}h
                </option>
              ))}
            </select>

            {error && (
              <div className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md border border-fg-muted/20 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !planCode}
                className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? 'Ativando...' : 'Ativar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
