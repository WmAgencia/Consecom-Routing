'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="mb-8 font-mono text-sm text-accent">
        ← Consecom Routing
      </Link>
      <h1 className="text-2xl font-semibold">Log in</h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm text-fg-muted">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border border-fg-muted/20 bg-bg-panel px-3 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-fg-muted">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border border-fg-muted/20 bg-bg-panel px-3 py-2 focus:border-accent focus:outline-none"
          />
        </label>

        {error && (
          <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-center text-sm text-fg-muted">
          No account yet?{' '}
          <Link href="/register" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}