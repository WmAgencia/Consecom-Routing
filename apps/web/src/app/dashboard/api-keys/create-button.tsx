'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiKeyCreated } from '@consecom/shared';

export function CreateKeyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<ApiKeyCreated | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const data: ApiKeyCreated = await res.json();
      setCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar chave');
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setName('');
    setCreated(null);
    setError(null);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        + Criar API Key
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-fg-muted/20 bg-bg-panel p-6">
            {!created ? (
              <>
                <h2 className="text-lg font-semibold">Nova API Key</h2>
                <p className="mt-1 text-sm text-fg-muted">Dê um nome para identificar depois.</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex.: produção OpenCode"
                  className="mt-4 w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  autoFocus
                />
                {error && (
                  <div className="mt-3 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                  </div>
                )}
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={close}
                    className="rounded-md px-4 py-2 text-sm text-fg-muted hover:text-fg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submit}
                    disabled={!name.trim() || loading}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {loading ? 'Criando...' : 'Criar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-success">
                  Sua nova API Key
                </h2>
                <p className="mt-1 text-sm text-warn">
                  ⚠️ Copie agora. Por segurança, ela não será exibida novamente.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-md bg-bg p-4 font-mono text-xs">
                  {created.key}
                </pre>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(created.key)}
                    className="rounded-md border border-fg-muted/30 px-4 py-2 text-sm hover:border-fg-muted"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={close}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
