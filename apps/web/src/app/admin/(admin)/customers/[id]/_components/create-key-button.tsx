'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function CreateKeyButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/v1/admin/customers/${customerId}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setError(await res.text());
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCreatedKey(data.key);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede');
      setLoading(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setName('');
    setCreatedKey(null);
    setCopied(false);
    setError(null);
    router.refresh();
  }

  async function copyKey() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
      >
        + Nova API Key
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-fg-muted/20 bg-bg-panel p-6">
            {!createdKey ? (
              <>
                <h2 className="font-serif text-xl">Nova API Key</h2>
                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-fg-muted">
                      Nome
                    </label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="produção, dev, etc"
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
                      onClick={closeModal}
                      className="flex-1 rounded-md border border-fg-muted/20 px-4 py-2 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                    >
                      {loading ? 'Criando...' : 'Criar'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="font-serif text-xl">API Key Criada ✓</h2>
                <p className="mt-1 text-xs text-danger">
                  Copie agora — <strong>não será mostrada novamente</strong>.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-md border border-fg-muted/15 bg-bg p-3 font-mono text-xs">
                  {createdKey}
                </pre>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={copyKey}
                    className="flex-1 rounded-md border border-fg-muted/20 px-4 py-2 text-sm"
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                  >
                    Pronto
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
