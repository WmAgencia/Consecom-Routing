const STEPS = [
  {
    n: '01',
    title: 'Compra o plano',
    body: 'PIX, cartão ou boleto. Aprovação na hora. Sem renovação automática surpresa.',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Recebe sua key',
    body: 'Imediato após o pagamento. Key pessoal no formato sk_cr_live_…, só sua.',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="15" r="4" />
        <path d="M10.85 12.15L19 4M15 8l2 2M18 5l2 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Cola no terminal',
    body: 'Dois exports e o claude vira "seu". Mesmo Claude Code, conta nossa.',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <ol className="relative grid gap-5 md:grid-cols-3">
      {/* Connector line (md+) */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-brasa-500/40 to-transparent md:block"
      />

      {STEPS.map((s, i) => (
        <li
          key={s.n}
          className="group relative flex flex-col rounded-2xl border border-white/5 bg-bg-panel/60 p-6 backdrop-blur-xl transition hover:border-brasa-500/30 hover:bg-bg-panel"
        >
          {/* Step number with icon */}
          <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brasa-500/20 to-brasa-700/10 ring-1 ring-brasa-500/30">
            <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-brasa-500 font-mono text-[10px] font-bold text-bg ring-2 ring-bg-panel">
              {s.n}
            </span>
            <span className="text-brasa-400">{s.icon}</span>
          </div>

          <h3 className="font-serif text-xl text-fg">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {s.body}
          </p>

          {/* Connector arrow (md+) */}
          {i < STEPS.length - 1 && (
            <svg
              aria-hidden
              className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-brasa-500/40 md:block"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </li>
      ))}
    </ol>
  );
}
