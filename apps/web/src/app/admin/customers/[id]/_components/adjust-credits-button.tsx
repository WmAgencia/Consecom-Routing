'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function AdjustCreditsButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/v1/admin/customers/${customerId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          delta: Number(delta),
          description: description || undefined,
        }),
      });
      if (!res.ok) {
        setError(await res.text());
        setLoading(false);
        return;
      }
      setOpen(false);
      setDelta('');
      setDescription('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-fg-muted/20 px-4 py-2 text-xs hover:border-accent"
      >
        Ajustar Créditos
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-3 rounded-xl border border-fg-muted/20 bg-bg-panel p-6"
          >
            <h2 className="font-serif text-xl">Ajustar Créditos</h2>
            <div>
              <label className="block text-xs uppercase tracking-wide text-fg-muted">
                Delta (positivo ou negativo)
              </label>
              <input
                required
                type="number"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="1000 ou -500"
                className="mt-1 w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-fg-muted">
                Descrição
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="bônus, correção, etc"
                className="mt-1 w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm"
              />
            </div>

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
                disabled={loading}
                className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
