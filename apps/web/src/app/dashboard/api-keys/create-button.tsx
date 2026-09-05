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
  const [copied, setCopied] = useState(false);

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
    setCopied(false);
    router.refresh();
  }

  async function copy() {
    if (!created) return;
    await navigator.clipboard.writeText(created.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brasa-500 to-brasa-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:shadow-glow-lg"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Criar API Key
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-bg-panel/95 shadow-glow-lg backdrop-blur-2xl">
            {/* Decorative gradient */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-brasa-500/20 to-transparent" />

            <div className="relative p-6">
              {!created ? (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brasa-500 to-brasa-700 shadow-glow">
                      <KeyIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl text-fg">Nova API Key</h2>
                      <p className="text-xs text-fg-muted">Dê um nome para identificar depois</p>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex.: produção OpenCode"
                    className="mt-2 block w-full rounded-xl border border-white/5 bg-bg-subtle/50 px-4 py-3 text-sm text-fg placeholder-fg-muted/50 transition focus:border-accent focus:bg-bg-subtle focus:outline-none focus:ring-2 focus:ring-accent/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && name.trim() && !loading) submit();
                    }}
                  />

                  {error && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={close}
                      className="rounded-xl px-4 py-2.5 text-sm text-fg-muted transition hover:bg-white/5 hover:text-fg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={submit}
                      disabled={!name.trim() || loading}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brasa-500 to-brasa-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:shadow-glow-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                            <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          Criando...
                        </>
                      ) : (
                        'Criar chave'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
                      <svg className="h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-serif text-xl text-fg">Sua nova API Key</h2>
                      <p className="text-xs text-fg-muted">Copie agora — não será exibida de novo</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-warn/30 bg-warn/5 p-4">
                    <p className="text-sm text-warn">
                      ⚠️ Por segurança, esta chave só é exibida uma vez. Salve em um local seguro agora.
                    </p>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-white/5 bg-bg/80">
                    <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                      <span className="text-[10px] uppercase tracking-widest text-fg-muted">
                        API Key
                      </span>
                      <button
                        onClick={copy}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-fg transition hover:bg-white/10"
                      >
                        {copied ? (
                          <>
                            <svg className="h-3 w-3 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Copiado!
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-xs text-fg">
                      {created.key}
                    </pre>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={close}
                      className="rounded-xl bg-gradient-to-r from-brasa-500 to-brasa-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:shadow-glow-lg"
                    >
                      Já copiei, fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="15" r="4" />
      <path d="M10.85 12.15L19 4M15 8l2 2M18 5l2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
