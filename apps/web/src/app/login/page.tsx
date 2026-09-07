'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type LoginMode = 'customer' | 'admin';

// Force dynamic — /login uses useSearchParams which can't be prerendered.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="font-mono text-xs text-fg-muted uppercase tracking-widest">Carregando…</div>
    </main>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode: LoginMode = searchParams.get('type') === 'admin' ? 'admin' : 'customer';

  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = mode === 'admin' ? '/api/proxy/v1/admin/login' : '/api/proxy/v1/auth/login';
  const successRedirect = mode === 'admin' ? '/admin' : '/dashboard';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      router.push(successRedirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  }

  function switchMode(newMode: LoginMode) {
    setMode(newMode);
    setError(null);
    // Update URL query without scrolling
    const url = new URL(window.location.href);
    if (newMode === 'admin') url.searchParams.set('type', 'admin');
    else url.searchParams.delete('type');
    window.history.replaceState({}, '', url.toString());
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brasa-500/20 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-brasa-700/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-mono text-sm text-fg-muted transition hover:text-fg"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          voltar
        </Link>

        <div className="rounded-3xl border border-white/5 bg-bg-panel/70 p-8 shadow-glow-lg backdrop-blur-2xl">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brasa-500 to-brasa-700 shadow-glow">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-2xl text-fg">Bem-vindo de volta</h1>
              <p className="text-xs text-fg-muted">Acesse seu painel Consecom</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/5 bg-bg-subtle/50 p-1">
            <button
              type="button"
              onClick={() => switchMode('customer')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                mode === 'customer'
                  ? 'bg-gradient-to-r from-brasa-500 to-brasa-600 text-white shadow-glow'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
              Cliente
            </button>
            <button
              type="button"
              onClick={() => switchMode('admin')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                mode === 'admin'
                  ? 'bg-gradient-to-r from-brasa-500 to-brasa-600 text-white shadow-glow'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7l3-7z" strokeLinejoin="round" />
              </svg>
              Admin
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-fg-muted">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="voce@empresa.com"
                className="mt-2 block w-full rounded-xl border border-white/5 bg-bg-subtle/50 px-4 py-3 text-sm text-fg placeholder-fg-muted/50 transition focus:border-accent focus:bg-bg-subtle focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-fg-muted">Senha</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
                className="mt-2 block w-full rounded-xl border border-white/5 bg-bg-subtle/50 px-4 py-3 text-sm text-fg placeholder-fg-muted/50 transition focus:border-accent focus:bg-bg-subtle focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brasa-500 to-brasa-600 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:shadow-glow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar como {mode === 'admin' ? 'Admin' : 'Cliente'}
                  <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>

            {mode === 'customer' && (
              <>
                <div className="relative my-2 flex items-center">
                  <div className="flex-1 border-t border-white/5" />
                  <span className="px-3 text-[10px] uppercase tracking-widest text-fg-muted">ou</span>
                  <div className="flex-1 border-t border-white/5" />
                </div>

                <p className="text-center text-sm text-fg-muted">
                  Não tem conta?{' '}
                  <Link href="/register" className="font-medium text-accent transition hover:text-accent-hover hover:underline">
                    Criar agora
                  </Link>
                </p>
              </>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-fg-muted">
          🔒 Sessões criptografadas · JWT seguro
        </p>
      </div>
    </main>
  );
}
