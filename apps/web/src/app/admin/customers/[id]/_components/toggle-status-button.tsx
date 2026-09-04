'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ToggleStatusButton({
  customerId,
  currentStatus,
}: {
  customerId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isSuspended = currentStatus === 'suspended';
  const targetStatus = isSuspended ? 'active' : 'suspended';

  async function handleClick() {
    if (!confirm(isSuspended ? 'Reativar este cliente?' : 'Suspender este cliente? Suas API Keys vão parar de funcionar.')) return;
    setLoading(true);
    try {
      await fetch(`/v1/admin/customers/${customerId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: targetStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-md border px-4 py-2 text-xs ${
        isSuspended
          ? 'border-success/30 text-success hover:bg-success/10'
          : 'border-warn/30 text-warn hover:bg-warn/10'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isSuspended ? 'Reativar' : 'Suspender'}
    </button>
  );
}
