export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Documentação</h1>
      <p className="mt-2 text-fg-muted">Quickstart e referência da API.</p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">1. Base URL</h2>
        <pre className="mt-2 rounded-md bg-bg-panel p-3 font-mono text-sm">
          https://api.consecomrouting.com/v1
        </pre>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">2. Autenticação</h2>
        <pre className="mt-2 rounded-md bg-bg-panel p-3 font-mono text-sm">
          {`Authorization: Bearer sk_cr_live_xxxxxxxxxxxxxxxxxxxxxxxx`}
        </pre>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">3. Exemplo</h2>
        <pre className="mt-2 overflow-x-auto rounded-md bg-bg-panel p-3 font-mono text-xs">
{`curl -X POST https://api.consecomrouting.com/v1/chat/completions \\
  -H "Authorization: Bearer sk_cr_live_xxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-5",
    "messages": [
      {"role": "user", "content": "Olá!"}
    ]
  }'`}
        </pre>
        <p className="mt-2 text-sm text-fg-muted">
          Compatível com o formato OpenAI Chat Completions.
        </p>
      </section>
    </main>
  );
}