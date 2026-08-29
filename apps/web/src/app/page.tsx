import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="font-mono text-lg font-semibold">Consecom Routing</div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-fg-muted hover:text-fg">
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="my-auto py-24">
        <h1 className="text-5xl font-bold tracking-tight">
          One API key.{' '}
          <span className="text-accent">Every AI model.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-fg-muted">
          Auth, billing, rate limits, model routing and cost tracking — handled.
          You consume AI through a single stable interface; we hide the providers.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/register"
            className="rounded-md bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover"
          >
            Start with R$30 test plan
          </Link>
          <Link
            href="/docs"
            className="rounded-md border border-fg-muted/30 px-6 py-3 font-medium text-fg hover:border-fg-muted"
          >
            Read the docs →
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              title: 'Auth',
              body: 'Bearer token. Refresh rotation. Tenant isolation enforced at the query layer.',
            },
            {
              title: 'Billing',
              body: 'Stripe-backed credits. R$30 = 100k credits = 3 days of testing.',
            },
            {
              title: 'Routing',
              body: 'ProviderAdapter interface. Add OpenAI, Google, Groq in one file when ready.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-fg-muted/15 bg-bg-panel p-5"
            >
              <div className="font-mono text-sm text-accent">{f.title}</div>
              <p className="mt-2 text-sm text-fg-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto text-xs text-fg-muted">
        <code className="font-mono">POST /v1/chat/completions</code> · OpenAI-compatible
      </footer>
    </main>
  );
}