import Link from 'next/link';
import { LiveTerminal } from './_components/live-terminal';
import { PricingCards } from './_components/pricing-cards';
import { HowItWorks } from './_components/how-it-works';
import { Clawd } from './_components/clawd'; // Claude mascot (3D image)

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brasa-500 font-mono text-sm font-bold text-bg">
            C
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight">
            consecom/routing
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="#duas-formas"
            className="hidden rounded-md px-3 py-2 text-fg-muted hover:text-fg sm:inline-block"
          >
            Como usar
          </Link>
          <Link
            href="#planos"
            className="hidden rounded-md px-3 py-2 text-fg-muted hover:text-fg sm:inline-block"
          >
            Planos
          </Link>
          <Link
            href="/codex"
            className="hidden rounded-md px-3 py-2 text-fg-muted hover:text-fg sm:inline-block"
          >
            Codex
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-fg-muted hover:text-fg"
          >
            Entrar
          </Link>
          <Link href="/register" className="btn-brasa text-sm">
            Começar
          </Link>
        </nav>
      </header>

      {/* Hero with Clawd */}
      <section className="relative mx-auto max-w-6xl px-6 pt-12 pb-16 lg:pt-16 lg:pb-24">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brasa-500/10 blur-[120px]" />

        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brasa-700/40 bg-brasa-700/10 px-3 py-1 text-xs font-medium text-brasa-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brasa-500" />
              agora com Claude Sonnet 4.5 + Haiku 4.5
            </div>
            <h1 className="font-serif text-5xl font-normal leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Claude Code{' '}
              <em className="text-brasa-500">ilimitado</em>
              <br />
              por assinatura.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
              Cole duas linhas no terminal e use o Claude Code o quanto quiser
              por 24h, 3 dias, 7 dias ou 30 dias. Sem contar tokens, sem cartão
              internacional, sem susto na fatura.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="#planos" className="btn-brasa text-base">
                Ver planos
                <span aria-hidden>→</span>
              </Link>
              <Link href="/codex" className="btn-ghost text-base">
                Usar com Codex
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-fg-muted">
              <div>
                <div className="font-mono text-2xl text-fg">2 min</div>
                <div>do pagamento ao primeiro commit</div>
              </div>
              <div className="h-10 w-px bg-fg-muted/20" />
              <div>
                <div className="font-mono text-2xl text-fg">PIX</div>
                <div>cartão e boleto aceitos</div>
              </div>
            </div>
          </div>

          {/* Clawd mascot + terminal */}
          <div className="animate-fade-up [animation-delay:200ms] flex flex-col items-center gap-4">
            <Clawd size={200} />
            <LiveTerminal />
          </div>
        </div>
      </section>

      {/* Duas formas de usar */}
      <section id="duas-formas" data-squisher="true" className="border-y border-fg-muted/10 bg-bg-subtle/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-widest text-brasa-500">
              duas formas de usar
            </div>
            <h2 className="mt-2 font-serif text-4xl tracking-tight">
              CLI ou app. <em className="text-brasa-500">A mesma key</em> serve nos dois.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Codex card */}
            <div className="group overflow-hidden rounded-3xl border border-white/5 bg-bg-panel/60 p-6 shadow-glow backdrop-blur-xl transition hover:border-brasa-500/30">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brasa-500 to-brasa-700 shadow-glow">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 17 10 11 4 5" />
                    <line x1="12" y1="19" x2="20" y2="19" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-xl text-fg">Com o Codex</h3>
                  <p className="text-xs text-fg-muted">OpenAI CLI direto do seu shell</p>
                </div>
              </div>

              <div className="terminal mb-4 overflow-hidden">
                <div className="terminal-header">
                  <span className="terminal-dot bg-danger" />
                  <span className="terminal-dot bg-warn" />
                  <span className="terminal-dot bg-success" />
                  <span className="ml-2">~/projeto · zsh</span>
                </div>
                <div className="terminal-body">
                  <div>
                    <span className="terminal-prompt">$</span>{' '}
                    <span className="text-fg">export OPENAI_API_BASE=</span>
                    <span className="text-brasa-300">"https://api.consecom.com.br/v1"</span>
                  </div>
                  <div>
                    <span className="terminal-prompt">$</span>{' '}
                    <span className="text-fg">export OPENAI_API_KEY=</span>
                    <span className="text-brasa-300">"sk_cr_live_..."</span>
                  </div>
                  <div className="pt-2">
                    <span className="terminal-prompt">$</span>{' '}
                    <span className="text-fg">codex </span>
                    <span className="text-brasa-300">"refatora esse módulo"</span>
                  </div>
                  <div className="text-fg-muted">⎯ Codex está analisando...</div>
                  <div className="text-success">✓ Pronto. 3 arquivos modificados.</div>
                </div>
              </div>

              <p className="text-sm text-fg-muted">
                Funciona com <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">codex</code>,{' '}
                <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">claude</code>, e qualquer CLI que respeite o padrão OpenAI.
              </p>
            </div>

            {/* Claude Code app card */}
            <div className="group overflow-hidden rounded-3xl border border-white/5 bg-bg-panel/60 p-6 shadow-glow backdrop-blur-xl transition hover:border-brasa-500/30">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brasa-500 to-brasa-700 shadow-glow">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-xl text-fg">Com o Claude Code</h3>
                  <p className="text-xs text-fg-muted">App desktop oficial da Anthropic</p>
                </div>
              </div>

              <div className="mb-4 overflow-hidden rounded-2xl border border-white/5 bg-bg/60 p-4">
                {/* Fake Claude Code app screenshot */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-danger" />
                    <span className="h-2 w-2 rounded-full bg-warn" />
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="ml-2 font-mono text-xs text-fg-muted">Claude Code — meu-projeto</span>
                  </div>
                  <div className="font-mono text-[10px] text-success">● conectado</div>
                </div>
                <div className="space-y-2 rounded-lg bg-bg-subtle/50 p-3 font-mono text-xs">
                  <div className="text-fg-muted">// Configurações → API</div>
                  <div className="text-fg">
                    Provider: <span className="text-brasa-300">Anthropic</span>
                  </div>
                  <div className="text-fg">
                    Base URL: <span className="text-brasa-300">https://api.consecom.com.br</span>
                  </div>
                  <div className="text-fg">
                    API Key: <span className="text-brasa-300">sk_cr_live_b3162a04...</span>
                  </div>
                  <div className="pt-1 text-success">✓ Autenticado · 17 modelos disponíveis</div>
                </div>
              </div>

              <p className="text-sm text-fg-muted">
                Funciona com <strong className="text-fg">Claude Code app</strong>, Cursor, Windsurf, Continue.dev e qualquer
                app que aceite custom base URL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section
        id="como-funciona"
        data-squisher="true"
        className="border-b border-fg-muted/10 py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-widest text-brasa-500">
              como funciona
            </div>
            <h2 className="mt-2 font-serif text-4xl tracking-tight">
              Você compra. A gente entrega a key.{' '}
              <em className="text-brasa-500">Você usa.</em>
            </h2>
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" data-squisher="true" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <div className="font-mono text-xs uppercase tracking-widest text-brasa-500">
              planos
            </div>
            <h2 className="mt-2 font-serif text-4xl tracking-tight">
              Pague pelo tempo.{' '}
              <em className="text-brasa-500">Use à vontade.</em>
            </h2>
            <p className="mt-3 text-fg-muted">
              Sem limite de mensagens, sem contar tokens, sem renovação
              automática surpresa.
            </p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* CTA final */}
      <section data-squisher="true" className="border-t border-fg-muted/10 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-4xl tracking-tight md:text-5xl">
            O Claude Code é seu.{' '}
            <em className="text-brasa-500">A conta é nossa.</em>
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Ativação manual em até 2h no horário comercial. Self-service em
            breve.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/register" className="btn-brasa text-base">
              Criar conta
            </Link>
            <Link href="/login" className="btn-ghost text-base">
              Já tenho
            </Link>
          </div>
        </div>
      </section>

      {/* Comunidade (grupo membros) */}
      <section data-squisher="true" className="border-t border-fg-muted/10 bg-bg-subtle/40 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            exclusivo para assinantes
          </div>
          <h2 className="font-serif text-4xl tracking-tight md:text-5xl">
            Entre no grupo de{' '}
            <em className="text-brasa-500">membros</em>
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Avisos de manutenção, novos modelos, dicas de uso e troca direta
            com a equipe. Acesso restrito a quem tem assinatura ativa.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/comunidade" className="btn-brasa text-base">
              Ver comunidade
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-fg-muted/10 py-8 text-center text-xs text-fg-muted">
        © Consecom ·{' '}
        <code className="font-mono">POST /v1/messages</code> · Anthropic-compatible
      </footer>
    </main>
  );
}
