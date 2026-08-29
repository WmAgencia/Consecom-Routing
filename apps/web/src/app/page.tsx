import Link from 'next/link';
import { LiveTerminal } from './_components/live-terminal';
import { PricingCards } from './_components/pricing-cards';
import { HowItWorks } from './_components/how-it-works';

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
            href="#planos"
            className="hidden rounded-md px-3 py-2 text-fg-muted hover:text-fg sm:inline-block"
          >
            Planos
          </Link>
          <Link
            href="#como-funciona"
            className="hidden rounded-md px-3 py-2 text-fg-muted hover:text-fg sm:inline-block"
          >
            Como funciona
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

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-24 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
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
              <Link href="/login" className="btn-ghost text-base">
                Já tenho conta
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

          {/* Live terminal */}
          <div className="animate-fade-up lg:animate-fade-up [animation-delay:200ms]">
            <LiveTerminal />
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section
        id="como-funciona"
        className="border-y border-fg-muted/10 bg-bg-subtle/40 py-24"
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
      <section id="planos" className="py-24">
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
      <section className="border-t border-fg-muted/10 py-24">
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

      <footer className="border-t border-fg-muted/10 py-8 text-center text-xs text-fg-muted">
        © Consecom ·{' '}
        <code className="font-mono">POST /v1/messages</code> · Anthropic-compatible
      </footer>
    </main>
  );
}
