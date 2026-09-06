'use client';

import Link from 'next/link';

const PLANS = [
  {
    code: 'STARTER',
    name: 'Ilimitado 24h',
    duration: '24 horas',
    price: 25,
    perDay: 'R$ 25,00 / dia',
    featured: false,
    blurb: 'Pra experimentar um projeto novo ou uma demo.',
    badge: null,
  },
  {
    code: 'PRO',
    name: 'Ilimitado 3 dias',
    duration: '3 dias',
    price: 49.9,
    perDay: 'R$ 16,63 / dia',
    featured: false,
    blurb: 'Um fim de semana inteiro de código assistido.',
    badge: null,
  },
  {
    code: 'POWER',
    name: 'Ilimitado 7 dias',
    duration: '7 dias',
    price: 109.9,
    perDay: 'R$ 15,70 / dia',
    featured: true,
    blurb: 'Destravar um projeto grande. Sprint de uma semana.',
    badge: 'Mais popular',
  },
  {
    code: 'ENTERPRISE',
    name: 'Ilimitado 30 dias',
    duration: '30 dias',
    price: 299.9,
    perDay: 'R$ 9,99 / dia',
    featured: false,
    blurb: 'Mês inteiro. Equipes pequenas. Renovação mensal.',
    badge: 'Melhor custo',
  },
];

const FEATURES = [
  'Uso ilimitado de mensagens',
  'Ilimitado em tudo (sem rate limit)',
  'Sonnet 4.5 + Haiku 4.5',
  '1 key pessoal, gerada na ativação',
  'Acesso ao grupo de membros no WhatsApp',
];

const formatBRL = (n: number) => n.toFixed(2).replace('.', ',');

export function PricingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PLANS.map((p) => (
        <div
          key={p.code}
          className={`group relative flex flex-col overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${
            p.featured
              ? 'border-brasa-500/50 bg-gradient-to-b from-brasa-500/[0.08] to-bg-panel/60 shadow-glow-lg hover:shadow-glow'
              : 'border-white/5 bg-bg-panel/60 backdrop-blur-xl hover:border-white/10 hover:shadow-glow'
          }`}
        >
          {/* Featured badge */}
          {p.badge && (
            <div
              className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                p.featured
                  ? 'bg-brasa-500 text-bg'
                  : 'bg-success/15 text-success'
              }`}
            >
              {p.badge}
            </div>
          )}

          {/* Plan code + name */}
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-brasa-500">
            {p.code}
          </div>
          <div className="mt-1 font-serif text-2xl text-fg">{p.name}</div>
          <div className="mt-1 text-xs text-fg-muted">{p.duration} de uso</div>

          {/* Price */}
          <div className="mt-6">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-sm text-fg-muted">R$</span>
              <span className="font-serif text-5xl font-medium text-fg">
                {formatBRL(p.price)}
              </span>
            </div>
            <div className="mt-1 font-mono text-xs text-fg-muted">
              {p.perDay}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6">
            <Link
              href="/register"
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
                p.featured
                  ? 'bg-gradient-to-r from-brasa-500 to-brasa-600 text-white shadow-glow hover:shadow-glow-lg'
                  : 'border border-white/10 bg-white/5 text-fg hover:border-brasa-500/40 hover:bg-white/10'
              }`}
            >
              Começar
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-white/5" />

          {/* Features */}
          <ul className="space-y-3 text-sm">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <svg
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    p.featured ? 'text-brasa-500' : 'text-success'
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-fg-muted">{f}</span>
              </li>
            ))}
          </ul>

          {/* Blurb */}
          <p className="mt-6 text-xs italic text-fg-muted">"{p.blurb}"</p>
        </div>
      ))}
    </div>
  );
}
