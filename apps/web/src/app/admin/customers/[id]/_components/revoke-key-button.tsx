'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RevokeKeyButton({ keyId }: { keyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!confirm('Revogar esta API Key? Esta ação não pode ser desfeita.')) return;
    setLoading(true);
    try {
      await fetch(`/v1/admin/api-keys/${keyId}/revoke`, {
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
      onClick={handleRevoke}
      disabled={loading}
      className="text-xs text-danger hover:underline disabled:opacity-50"
    >
      {loading ? '...' : 'revogar'}
    </button>
  );
}
