'use client';

// Social proof section with animated counters
// Numbers: substituir pelos reais quando disponíveis
const STATS = [
  { value: 1247, suffix: '+', label: 'assinaturas ativas' },
  { value: 18, suffix: 'min', label: 'tempo médio de ativação' },
  { value: 99.9, suffix: '%', label: 'uptime nos últimos 90 dias' },
  { value: 4.9, suffix: '/5', label: 'satisfação dos assinantes' },
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    const duration = 1400;
    const steps = 50;
    const stepTime = duration / steps;
    let current = 0;
    const tick = () => {
      current += 1;
      // Ease-out cubic
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (current < steps) {
        setTimeout(tick, stepTime);
      } else {
        setValue(target);
      }
    };
    setTimeout(tick, 200);
  }, [target]);

  const display = Number.isInteger(target) ? value.toLocaleString('pt-BR') : value.toFixed(1);
  return (
    <span>
      {display}
      <span className="text-fg-muted">{suffix}</span>
    </span>
  );
}

export function SocialProof() {
  return (
    <section className="border-y border-white/5 bg-bg/40 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-serif text-4xl text-fg md:text-5xl">
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-xs uppercase tracking-widest text-fg-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
