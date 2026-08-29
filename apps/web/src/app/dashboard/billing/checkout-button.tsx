'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Self-service checkout is temporarily disabled — plans moved to a
 * time-based unlimited model that doesn't fit Stripe's standard checkout.
 * Activation is now handled by the admin via the Master Panel.
 */
export function CheckoutButton({ planCode: _planCode }: { planCode: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planCode: _planCode }),
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
        onClick={request}
        disabled={loading}
        className="w-full rounded-md border border-fg-muted/30 px-4 py-2 text-sm font-medium text-fg-muted hover:border-fg-muted disabled:opacity-50"
      >
        {loading ? 'Processando…' : 'Solicitar ativação ao admin'}
      </button>
      {error && (
        <div className="mt-2 rounded border border-warn/40 bg-warn/10 px-2 py-1 text-xs text-warn">
          {error}
        </div>
      )}
    </div>
  );
}