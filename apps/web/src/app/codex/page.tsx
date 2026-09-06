import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Codex Setup - Consecom Routing',
};

const COPY_COMMAND = 'export OPENAI_API_KEY="sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74"\nexport OPENAI_API_BASE="https://api-production-d761c.up.railway.app/v1"';

const CONFIG_TOML = '[openai]\napi_key = "sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74"\nbase_url = "https://api-production-d761c.up.railway.app/v1"';

export default function CodexPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 font-mono text-sm text-fg-muted transition hover:text-fg"
      >
        voltar
      </Link>

      <div className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs uppercase tracking-widest text-success">
          OpenAI-compatible
        </div>
        <h1 className="mt-4 font-serif text-4xl text-fg">
          Use Codex CLI com a API do Consecom
        </h1>
        <p className="mt-3 max-w-2xl text-fg-muted">
          Configure o Codex CLI em 30 segundos para usar nossos modelos Claude
          com roteamento inteligente. Multi-provider com fallback automatico
          para garantir disponibilidade maxima.
        </p>
      </div>

      <section className="mb-10 rounded-3xl border border-white/5 bg-bg-panel/60 p-6 shadow-glow backdrop-blur-xl">
        <h2 className="flex items-center gap-2 font-serif text-xl text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brasa-500 to-brasa-700 font-mono text-sm text-white">
            1
          </span>
          Setup rapido
        </h2>
        <p className="mt-2 text-sm text-fg-muted">Cole no seu shell:</p>
        <CodeBlock code={COPY_COMMAND} language="bash" />
        <p className="mt-3 text-sm text-fg-muted">
          Ou edite ~/.codex/config.toml:
        </p>
        <CodeBlock code={CONFIG_TOML} language="toml" />
      </section>

      <section className="mb-10 rounded-3xl border border-white/5 bg-bg-panel/60 p-6 shadow-glow backdrop-blur-xl">
        <h2 className="flex items-center gap-2 font-serif text-xl text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brasa-500 to-brasa-700 font-mono text-sm text-white">
            2
          </span>
          Use o Codex
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <UsageCard title="Pergunta rapida" command='codex "explique este regex"' />
          <UsageCard title="Tarefa pesada" command="codex -m claude-opus-5 revisa performance" />
          <UsageCard title="Git commit" command="git diff | codex -m claude-sonnet-5 gere commit" />
          <UsageCard title="REPL interativo" command="codex --model claude-opus-5" />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-xl text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brasa-500 to-brasa-700 font-mono text-sm text-white">
            3
          </span>
          Modelos disponiveis
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModelCard code="claude-haiku-4-5" tag="Recomendado" tagTone="success" desc="Rapido + barato, alta disponibilidade" />
          <ModelCard code="claude-sonnet-5" tag="Equilibrado" tagTone="accent" desc="Coding + chat, alta disponibilidade" />
          <ModelCard code="claude-opus-5" tag="Pesado" tagTone="warn" desc="Tarefas complexas, alta disponibilidade" />
          <ModelCard code="claude-haiku-4-5" tag="Fallback" tagTone="muted" desc="Anthropic direto" />
        </div>
      </section>

      <section className="mb-10 rounded-3xl border border-brasa-500/20 bg-gradient-to-br from-brasa-500/5 to-transparent p-6">
        <h3 className="font-serif text-base text-fg">Testar agora no terminal</h3>
        <CodeBlock
          code='curl -s https://api-production-d761c.up.railway.app/v1/models -H "Authorization: Bearer sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74"'
          language="bash"
        />
        <p className="mt-3 text-sm text-fg-muted">
          Deve retornar JSON no formato OpenAI com seus 17 modelos ativos.
        </p>
      </section>
    </main>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/5 bg-bg/80">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-2">
        <span className="text-[10px] uppercase tracking-widest text-fg-muted">{language}</span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-fg">
          copiar
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg">{code}</pre>
    </div>
  );
}

function UsageCard({ title, command }: { title: string; command: string }) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-bg-panel/40 p-4 backdrop-blur-xl transition hover:border-brasa-500/30">
      <div className="flex items-center gap-2">
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
