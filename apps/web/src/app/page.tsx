import Link from 'next/link';
import { LiveTerminal } from './_components/live-terminal';
import { PricingCards } from './_components/pricing-cards';
import { HowItWorks } from './_components/how-it-works';
import { Clawd } from './_components/clawd'; // Claude mascot (3D image)
import { CodexMockup, ClaudeCodeMockup } from './_components/app-mockups';

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-30 mx-auto flex max-w-6xl items-center justify-between border-b border-white/5 bg-bg/70 px-6 py-4 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brasa-400 via-brasa-500 to-brasa-700 shadow-glow">
            <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
            <span className="relative font-mono text-sm font-bold text-white">C</span>
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-sm font-semibold tracking-tight text-fg">
              consecom
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fg-muted">
              routing
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="#duas-formas"
            className="hidden rounded-md px-3 py-2 text-fg-muted transition hover:text-fg md:inline-block"
          >
            Como usar
          </Link>
          <Link
            href="#planos"
            className="hidden rounded-md px-3 py-2 text-fg-muted transition hover:text-fg md:inline-block"
          >
            Planos
          </Link>
          <Link
            href="/codex"
            className="hidden rounded-md px-3 py-2 text-fg-muted transition hover:text-fg md:inline-block"
          >
            Codex
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-fg-muted transition hover:text-fg"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brasa-500 to-brasa-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:shadow-glow-lg"
          >
            Começar grátis
          </Link>
        </nav>
      </header>

      {/* Hero with Clawd */}
      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 lg:pt-28 lg:pb-32">
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brasa-500/10 blur-[140px]" />
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-brasa-700/[0.07] blur-[100px]" />

        <div className="relative grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
          <div className="animate-fade-up">
            {/* Status badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brasa-700/40 bg-brasa-700/[0.08] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-brasa-300 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-brasa-500 opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-brasa-500" />
              </span>
              4 modelos · resposta em 1.5s · uptime 99.9%
            </div>

            <h1 className="font-serif text-[clamp(3rem,7vw,5.5rem)] font-normal leading-[0.95] tracking-[-0.04em]">
              Claude Code
              <br />
              <em className="bg-gradient-to-r from-brasa-400 via-brasa-500 to-brasa-600 bg-clip-text not-italic text-transparent">
                ilimitado
              </em>
              <br />
              <span className="text-fg-muted">por assinatura.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-fg-muted">
              Acesso ilimitado ao Claude Code por <span className="text-fg font-medium">24h a 30 dias</span>.
              Sem contar tokens, sem cartão internacional, sem susto na fatura.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brasa-500 to-brasa-600 px-6 py-3 text-base font-semibold text-white shadow-glow transition hover:shadow-glow-lg"
              >
                Começar agora
                <svg className="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/codex"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-base font-medium text-fg backdrop-blur-sm transition hover:border-brasa-500/40 hover:bg-white/10"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 9l3 3-3 3M16 9l-3 3 3 3" />
                </svg>
                Usar com Codex
              </Link>
            </div>

            {/* Trust row */}
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center gap-2 text-fg-muted">
                <svg className="h-4 w-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sem cartão internacional
              </div>
              <div className="flex items-center gap-2 text-fg-muted">
                <svg className="h-4 w-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                PIX, cartão e boleto
              </div>
              <div className="flex items-center gap-2 text-fg-muted">
                <svg className="h-4 w-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Setup em 60s
              </div>
            </div>
          </div>

          {/* Clawd mascot + terminal */}
          <div className="animate-fade-up flex flex-col items-center gap-5 [animation-delay:200ms]">
            <Clawd size={260} />
            <LiveTerminal />
          </div>
        </div>
      </section>

      {/* Duas formas de usar */}
      <section
        id="duas-formas"
        data-squisher="true"
        className="border-y border-white/5 bg-bg-subtle/40 py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-brasa-500">
              [ 01 ] — Como usar
            </div>
            <h2 className="font-serif text-4xl tracking-[-0.03em] md:text-5xl">
              CLI ou App.{' '}
              <em className="text-brasa-500 not-italic">A mesma key</em> nos dois.
            </h2>
            <p className="mt-3 text-fg-muted">
              Funciona com qualquer ferramenta que aceite base URL customizada.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Codex card */}
            <div className="group overflow-hidden rounded-3xl border border-white/5 bg-bg-panel/60 p-6 shadow-glow backdrop-blur-xl transition hover:border-emerald-500/30">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-glow">
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

              <div className="mb-4 overflow-hidden rounded-2xl border border-emerald-500/20 shadow-2xl">
                <CodexMockup />
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

              <div className="mb-4 overflow-hidden rounded-2xl border border-brasa-500/20 shadow-2xl">
                <ClaudeCodeMockup />
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
        className="py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-brasa-500">
              [ 02 ] — Como funciona
            </div>
            <h2 className="font-serif text-4xl tracking-[-0.03em] md:text-5xl">
              Você compra.{' '}
              <em className="text-brasa-500 not-italic">A gente entrega</em> a key.
            </h2>
            <p className="mt-3 text-fg-muted">
              Três passos. Sem cadastro complicado. Sem cartão internacional.
            </p>
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" data-squisher="true" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-brasa-500">
              [ 03 ] — Planos
            </div>
            <h2 className="font-serif text-4xl tracking-[-0.03em] md:text-5xl">
              Pague pelo tempo.{' '}
              <em className="text-brasa-500 not-italic">Use à vontade.</em>
            </h2>
            <p className="mt-3 text-fg-muted">
              Sem limite de mensagens. Sem contar tokens. Sem renovação surpresa.
            </p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* CTA final */}
      <section data-squisher="true" className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brasa-700/40 bg-brasa-700/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-brasa-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brasa-500" />
            Setup em 60 segundos
          </div>
          <h2 className="font-serif text-4xl tracking-[-0.03em] md:text-5xl">
            O Claude Code é seu.{' '}
            <em className="text-brasa-500 not-italic">A conta é nossa.</em>
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Ativação manual em até 2h no horário comercial. Self-service em breve.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brasa-500 to-brasa-600 px-6 py-3 text-base font-semibold text-white shadow-glow transition hover:shadow-glow-lg"
            >
              Criar conta
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-base font-medium text-fg backdrop-blur-sm transition hover:border-brasa-500/40 hover:bg-white/10"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Comunidade */}
      <section data-squisher="true" className="border-t border-white/5 bg-bg-subtle/40 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            exclusivo para assinantes
          </div>
          <h2 className="font-serif text-4xl tracking-[-0.03em] md:text-5xl">
            Entre no grupo de{' '}
            <em className="text-brasa-500 not-italic">membros</em>
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Avisos de manutenção, novos modelos, dicas de uso e troca direta
            com a equipe. Acesso restrito a quem tem assinatura ativa.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/comunidade" className="rounded-xl bg-gradient-to-r from-brasa-500 to-brasa-600 px-6 py-3 text-base font-semibold text-white shadow-glow transition hover:shadow-glow-lg">
              Entrar na comunidade
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-bg-panel/20 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-fg-muted sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-brasa-500 font-mono text-xs font-bold text-bg">
                C
              </span>
              <span>© Consecom · Claude Code ilimitado por assinatura</span>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/codex" className="hover:text-fg">
                Codex
              </Link>
              <Link href="/login" className="hover:text-fg">
                Entrar
              </Link>
              <code className="font-mono text-[10px]">POST /v1/messages</code>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
