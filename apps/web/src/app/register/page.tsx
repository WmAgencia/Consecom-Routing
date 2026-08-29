'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', name: '', doc: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          doc: form.doc || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="mb-8 font-mono text-sm text-accent">
        ← Consecom Routing
      </Link>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-fg-muted">
        After registration, purchase a test plan to activate your API key.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
        />
        <Field
          label="CPF / CNPJ (optional)"
          value={form.doc}
          onChange={(v) => setForm({ ...form, doc: v })}
        />

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
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-fg-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-fg-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 block w-full rounded-md border border-fg-muted/20 bg-bg-panel px-3 py-2 text-fg placeholder:text-fg-muted/60 focus:border-accent focus:outline-none"
      />
    </label>
  );
}