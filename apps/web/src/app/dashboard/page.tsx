import Link from 'next/link';
import { headers } from 'next/headers';

async function getMe() {
  const h = await headers();
  const cookie = h.get('cookie') ?? '';
  const host = h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  try {
    const res = await fetch(`${proto}://${host}/v1/auth/me`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPlaceholder() {
  const me = await getMe();
  if (!me) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-fg-muted">
          You are not logged in.{' '}
          <Link href="/login" className="text-accent">
            Log in
          </Link>{' '}
          or{' '}
          <Link href="/register" className="text-accent">
            create an account
          </Link>
          .
        </p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Olá, {me.user.name}</h1>
        <span className="font-mono text-xs text-fg-muted">{me.user.email}</span>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Plano" value="—" />
        <Stat label="Créditos" value="—" />
        <Stat label="Requests" value="—" />
      </div>

      <section className="mt-10 rounded-lg border border-fg-muted/15 bg-bg-panel p-6">
        <h2 className="text-lg font-semibold">Ative seu plano de teste</h2>
        <p className="mt-2 text-sm text-fg-muted">
          O checkout Stripe entra na FASE 4. Por enquanto, este é um placeholder
          do dashboard.
        </p>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5">
      <div className="text-xs uppercase tracking-wide text-fg-muted">{label}</div>
      <div className="mt-2 font-mono text-2xl">{value}</div>
    </div>
  );
}