'use client';

import { useState } from 'react';
import { CopyBlock } from './copy-block';

interface Props {
  planName: string;
  planCode: string;
  durationLabel: string;
  days: number;
  hours: number;
  minutes: number;
  keyPrefix: string | null;
  apiUrl: string;
}

const COMMANDS = [
  { id: 'key', label: 'sua key pessoal' },
];

export function AccessSetup({
  planName,
  planCode,
  durationLabel,
  days,
  hours,
  minutes,
  keyPrefix,
  apiUrl,
}: Props) {
  const [keyInput, setKeyInput] = useState('');
  const hasKey = Boolean(keyInput || keyPrefix);

  const exports = hasKey
    ? [
        `export ANTHROPIC_AUTH_TOKEN=${keyInput || (keyPrefix ?? 'sk_cr_live_…')}`,
        `export ANTHROPIC_BASE_URL=${apiUrl}`,
      ]
    : [];

  return (
    <>
      {/* Plan + countdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-fg-muted/10 bg-bg-panel p-6">
          <div className="text-xs uppercase tracking-widest text-fg-muted">
            {planCode}
          </div>
          <div className="mt-2 font-serif text-3xl">{planName}</div>
          <div className="mt-1 text-sm text-fg-muted">
            válido por {durationLabel} · uso ilimitado
          </div>
        </div>
        <div className="rounded-xl border border-brasa-500/40 bg-brasa-700/10 p-6 shadow-glow">
          <div className="text-xs uppercase tracking-widest text-brasa-300">
            tempo restante
          </div>
          <div className="mt-2 flex items-baseline gap-1 font-mono">
            <span className="font-serif text-5xl text-brasa-500">{days}</span>
            <span className="text-lg text-brasa-300">d</span>
            <span className="ml-3 font-serif text-5xl text-brasa-500">
              {String(hours).padStart(2, '0')}
            </span>
            <span className="text-lg text-brasa-300">h</span>
            <span className="ml-3 font-serif text-3xl text-brasa-300">
              {String(minutes).padStart(2, '0')}
            </span>
            <span className="text-sm text-brasa-300">min</span>
          </div>
        </div>
      </div>

      {/* Como configurar */}
      <section className="mt-8">
        <h2 className="font-serif text-2xl tracking-tight">Como configurar</h2>
        <div className="mt-4 space-y-3">
          <Step n={1} title="Cole sua key" subtitle="A que você recebeu por email ou viu no momento da criação.">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={keyPrefix ? `${keyPrefix}…` : 'sk_cr_live_…'}
              className="w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 font-mono text-sm focus:border-brasa-500 focus:outline-none"
            />
            {keyPrefix && !keyInput && (
              <p className="mt-2 text-xs text-fg-muted">
                Detectamos sua key ativa ({keyPrefix}…). Cole só o final se
                lembrar — o prefixo será completado.
              </p>
            )}
          </Step>

          {hasKey && (
            <Step n={2} title="Gere o comando pro terminal" subtitle="Copie e cole no seu shell.">
              <div className="terminal">
                <div className="terminal-header">
                  <span className="terminal-dot bg-brasa-700" />
                  <span className="terminal-dot bg-brasa-500/60" />
                  <span className="terminal-dot bg-brasa-300/40" />
                  <span className="ml-3 font-mono text-xs">comando</span>
                </div>
                <div className="terminal-body space-y-1">
                  {exports.map((cmd, i) => (
                    <CopyBlock key={i} text={cmd} />
                  ))}
                </div>
              </div>
            </Step>
          )}

          <Step n={hasKey ? 3 : 2} title="Abra o Claude Code" subtitle="Se ainda não tem, instale com npm i -g @anthropic-ai/claude-code.">
            <div className="terminal">
              <div className="terminal-header">
                <span className="terminal-dot bg-brasa-700" />
                <span className="terminal-dot bg-brasa-500/60" />
                <span className="terminal-dot bg-brasa-300/40" />
                <span className="ml-3 font-mono text-xs">terminal</span>
              </div>
              <div className="terminal-body">
                <CopyBlock text="claude" />
              </div>
            </div>
          </Step>

          <Step n={hasKey ? 4 : 3} title="Pronto" subtitle="O Claude Code passa a usar nossos servidores. Mensagens ilimitadas pelo tempo do plano.">
            <p className="text-sm text-fg-muted">
              Para trocar de máquina, repita os passos 1–2. Para revogar uma
              key perdida, vá em API Keys.
            </p>
          </Step>
        </div>
      </section>
    </>
  );
}

function Step({
  n,
  title,
  subtitle,
  children,
}: {
  n: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-fg-muted/10 bg-bg-panel p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brasa-500/40 bg-brasa-700/15 font-mono text-sm text-brasa-500">
          {n}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-fg-muted">{subtitle}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
