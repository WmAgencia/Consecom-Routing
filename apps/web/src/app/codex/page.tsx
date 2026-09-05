import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Codex Setup — Consecom Routing',
};

const COPY_COMMAND = `export OPENAI_API_KEY="sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74"
export OPENAI_API_BASE="https://api-production-d761c.up.railway.app/v1"`;

const CONFIG_TOML = `[openai]
api_key = "sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74"
base_url = "https://api-production-d761c.up.railway.app/v1"`;

export default function CodexPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 font-mono text-sm text-fg-muted transition hover:text-fg"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        voltar
      </Link>

      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs uppercase tracking-widest text-success">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          OpenAI-compatible
        </div>
        <h1 className="mt-4 font-serif text-4xl text-fg">
          Use <span className="text-gradient">Codex CLI</span> com a API do Consecom
        </h1>
        <p className="mt-3 max-w-2xl text-fg-muted">
          Configure o Codex CLI em 30 segundos pra usar nossos modelos Claude com roteamento
          inteligente. Puter como primário, fallback automático pra OpenRouter, Poyo e Anthropic.
        </p>
      </div>

      {/* Quick setup */}
      <section className="mb-10 rounded-3xl border border-white/5 bg-bg-panel/60 p-6 shadow-glow backdrop-blur-xl">
        <h2 className="flex items-center gap-2 font-serif text-xl text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brasa-500 to-brasa-700 font-mono text-sm text-white">
            1
          </span>
          Setup rápido
        </h2>
        <p className="mt-2 text-sm text-fg-muted">Cole no seu shell:</p>
        <CodeBlock code={COPY_COMMAND} language="bash" />
        <p className="mt-3 text-sm text-fg-muted">Ou edite <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">~/.codex/config.toml</code>:</p>
        <CodeBlock code={CONFIG_TOML} language="toml" />
      </section>

      {/* Usage */}
      <section className="mb-10 rounded-3xl border border-white/5 bg-bg-panel/60 p-6 shadow-glow backdrop-blur-xl">
        <h2 className="flex items-center gap-2 font-serif text-xl text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brasa-500 to-brasa-700 font-mono text-sm text-white">
            2
          </span>
          Use o Codex
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <UsageCard
            title="Pergunta rápida"
            command='codex "explique este regex"'
            icon="💬"
          />
          <UsageCard
            title="Tarefa pesada"
            command="codex -m claude-opus-5-puter \"revise performance\""
            icon="⚡"
          />
          <UsageCard
            title="Git commit"
            command="git diff | codex -m claude-sonnet-5-puter \"gere commit\""
            icon="📝"
          />
          <UsageCard
            title="REPL interativo"
            command="codex --model claude-opus-5-puter"
            icon="🔁"
          />
        </div>
      </section>

      {/* Models */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-xl text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brasa-500 to-brasa-700 font-mono text-sm text-white">
            3
          </span>
          Modelos disponíveis
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModelCard code="claude-haiku-4-5-puter" tag="Recomendado" tagTone="success" desc="Rápido + barato, Puter" />
          <ModelCard code="claude-sonnet-5-puter" tag="Equilibrado" tagTone="accent" desc="Coding + chat, Puter" />
          <ModelCard code="claude-opus-5-puter" tag="Pesado" tagTone="warn" desc="Tarefas complexas, Puter" />
          <ModelCard code="claude-haiku-4-5" tag="Fallback" tagTone="muted" desc="Anthropic direto (precisa chave)" />
        </div>
      </section>

      {/* Test command */}
      <section className="mb-10 rounded-3xl border border-brasa-500/20 bg-gradient-to-br from-brasa-500/5 to-transparent p-6">
        <h3 className="font-serif text-base text-fg">Testar agora no terminal</h3>
        <CodeBlock
          code='curl -s https://api-production-d761c.up.railway.app/v1/models -H "Authorization: Bearer sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74" | head -c 500'
          language="bash"
        />
        <p className="mt-3 text-sm text-fg-muted">
          Deve retornar JSON no formato OpenAI com seus 17 modelos ativos.
        </p>
      </section>

      <p className="text-center text-xs text-fg-muted">
        Dúvidas? <Link href="/dashboard" className="text-accent hover:underline">ver dashboard</Link> ou
        voltar pra <Link href="/" className="text-accent hover:underline">home</Link>
      </p>
    </main>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/5 bg-bg/80">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-2">
        <span className="text-[10px] uppercase tracking-widest text-fg-muted">{language}</span>
        <button
          onClick={() => navigator.clipboard?.writeText(code)}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-fg transition hover:bg-white/10"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          copiar
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg">{code}</pre>
    </div>
  );
}

function UsageCard({ title, command, icon }: { title: string; command: string; icon: string }) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-bg-panel/40 p-4 backdrop-blur-xl transition hover:border-brasa-500/30">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-fg">{title}</span>
      </div>
      <code className="mt-3 block break-all rounded-lg bg-bg/60 p-2 font-mono text-xs text-fg-muted">
        {command}
      </code>
    </div>
  );
}

function ModelCard({
  code,
  tag,
  tagTone,
  desc,
}: {
  code: string;
  tag: string;
  tagTone: 'success' | 'accent' | 'warn' | 'muted';
  desc: string;
}) {
  const tagColors = {
    success: 'bg-success/15 text-success',
    accent: 'bg-accent/15 text-accent',
    warn: 'bg-warn/15 text-warn',
    muted: 'bg-fg-muted/15 text-fg-muted',
  };
  return (
    <div className="rounded-2xl border border-white/5 bg-bg-panel/40 p-4 backdrop-blur-xl transition hover:border-white/10">
      <div className="flex items-center justify-between gap-2">
        <code className="font-mono text-sm text-fg">{code}</code>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tagColors[tagTone]}`}>
          {tag}
        </span>
      </div>
      <p className="mt-2 text-xs text-fg-muted">{desc}</p>
    </div>
  );
}
