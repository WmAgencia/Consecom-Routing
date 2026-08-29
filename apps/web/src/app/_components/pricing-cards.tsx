'use client';

import Link from 'next/link';

const PLANS = [
  {
    code: 'STARTER',
    name: 'Ilimitado 24h',
    duration: '24 horas',
    price: 25,
    rate: '30 req/min',
    featured: false,
    blurb: 'Pra experimentar um projeto novo ou uma demo.',
  },
  {
    code: 'PRO',
    name: 'Ilimitado 3 dias',
    duration: '3 dias',
    price: 49.9,
    rate: '60 req/min',
    featured: false,
    blurb: 'Um fim de semana inteiro de código assistido.',
  },
  {
    code: 'POWER',
    name: 'Ilimitado 7 dias',
    duration: '7 dias',
    price: 109.9,
    rate: '100 req/min',
    featured: true,
    blurb: 'Destravar um projeto grande. Sprint de uma semana.',
  },
  {
    code: 'ENTERPRISE',
    name: 'Ilimitado 30 dias',
    duration: '30 dias',
    price: 299.9,
    rate: '200 req/min',
    featured: false,
    blurb: 'Mês inteiro. Equipes pequenas. Renovação mensal.',
  },
];

const formatBRL = (n: number) =>
  n.toFixed(2).replace('.', ',');

export function PricingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PLANS.map((p) => (
        <div
          key={p.code}
          className={`plan-card flex flex-col ${
            p.featured ? 'plan-card-featured' : ''
          }`}
        >
          {p.featured && (
            <div className="mb-4 inline-flex w-fit items-center gap-1 rounded-full bg-brasa-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-bg">
              mais popular
            </div>
          )}
          <div className="font-mono text-xs uppercase tracking-widest text-brasa-500">
            {p.code}
          </div>
          <div className="mt-1 text-xl font-semibold">{p.name}</div>
          <div className="mt-1 text-xs text-fg-muted">{p.duration} de uso</div>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-sm text-fg-muted">R$</span>
            <span className="font-serif text-5xl text-brasa-500">
              {formatBRL(p.price)}
            </span>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-fg-muted">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brasa-500" />
              <span>Uso ilimitado de mensagens</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brasa-500" />
              <span>{p.rate} — sustenta código pesado</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brasa-500" />
              <span>Sonnet 4.5 + Haiku 4.5</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brasa-500" />
              <span>1 key pessoal, gerada na ativação</span>
            </li>
          </ul>
          <p className="mt-5 text-xs text-fg-muted">{p.blurb}</p>
          <div className="mt-auto pt-6">
            <Link
              href="/register"
              className={p.featured ? 'btn-brasa w-full' : 'btn-ghost w-full'}
            >
              Começar
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
