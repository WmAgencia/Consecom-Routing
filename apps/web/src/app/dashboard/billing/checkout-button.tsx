'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CheckoutButton({ planCode }: { planCode: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planCode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        onClick={checkout}
        disabled={loading}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? 'Redirecionando...' : 'Assinar'}
      </button>
      {error && (
        <div className="mt-2 rounded border border-danger/40 bg-danger/10 px-2 py-1 text-xs text-danger">
          {error}
        </div>
      )}
    </div>
  );
}
