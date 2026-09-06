'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ToggleModelButton({
  modelId,
  status,
}: {
  modelId: string;
  status: 'active' | 'disabled';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await fetch(`/v1/admin/models/${modelId}/toggle`, {
        method: 'POST',
        credentials: 'include',
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
        status === 'active'
          ? 'border-warn/30 text-warn hover:bg-warn/10'
          : 'border-success/30 text-success hover:bg-success/10'
      } disabled:opacity-50`}
    >
      {loading ? '...' : status === 'active' ? 'desabilitar' : 'habilitar'}
    </button>
  );
}
