'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TogglePlanButton({ planId, active }: { planId: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await fetch(`/v1/admin/plans/${planId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !active }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-md border px-3 py-1 text-xs ${
        active
          ? 'border-success/30 text-success hover:bg-success/10'
          : 'border-fg-muted/20 text-fg-muted hover:border-accent'
      } disabled:opacity-50`}
    >
      {loading ? '...' : active ? 'ativo' : 'inativo'}
    </button>
  );
}
