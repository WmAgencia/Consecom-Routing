const STEPS = [
  {
    n: '01',
    title: 'Compra o plano',
    body: 'PIX, cartão ou boleto. Aprovação na hora. Sem renovação automática.',
  },
  {
    n: '02',
    title: 'Recebe sua key',
    body: 'Imediato após o pagamento. Key pessoal no formato sk_cr_live_…, só sua.',
  },
  {
    n: '03',
    title: 'Cola no terminal',
    body: 'Dois exports e o claude vira "seu". Mesmo Claude Code, conta nossa.',
  },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {STEPS.map((s) => (
        <li
          key={s.n}
          className="rounded-xl border border-fg-muted/10 bg-bg-panel p-6"
        >
          <div className="font-mono text-3xl text-brasa-500">{s.n}</div>
          <div className="mt-3 text-lg font-semibold">{s.title}</div>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {s.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
