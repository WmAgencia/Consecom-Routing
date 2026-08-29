'use client';

import { useEffect, useState } from 'react';

const API_URL = 'https://api.routing.consecom.com.br/v1';
const KEY_PLACEHOLDER = 'sk_cr_live_a7f2c9d1e4b8';

const LINES: Array<{ kind: 'cmd' | 'comment' | 'out'; text: string; delay: number }> = [
  { kind: 'comment', text: '# sua key pessoal chegou por email — cole aqui:', delay: 400 },
  { kind: 'cmd', text: `export ANTHROPIC_AUTH_TOKEN=${KEY_PLACEHOLDER}`, delay: 1600 },
  { kind: 'cmd', text: `export ANTHROPIC_BASE_URL=${API_URL}`, delay: 1100 },
  { kind: 'comment', text: '', delay: 600 },
  { kind: 'cmd', text: 'claude "refatora esse componente pra React Server Components"', delay: 900 },
  { kind: 'out', text: '✦ Lendo src/components/Card.tsx…', delay: 700 },
  { kind: 'out', text: '✦ Sugerindo split entre server e client boundaries…', delay: 600 },
];

export function LiveTerminal() {
  const [shownCount, setShownCount] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [lineIndex, setLineIndex] = useState(-1);

  useEffect(() => {
    if (lineIndex < 0 || lineIndex >= LINES.length) return;

    const line = LINES[lineIndex];
    if (!line) return;

    if (line.kind === 'cmd' || line.kind === 'out') {
      // Typewriter for commands and outputs
      let i = 0;
      const id = setInterval(() => {
        i++;
        setTypedText(line.text.slice(0, i));
        if (i >= line.text.length) {
          clearInterval(id);
          setTimeout(() => {
            setShownCount((n) => n + 1);
            setLineIndex((n) => n + 1);
            setTypedText('');
          }, 300);
        }
      }, 18);
      return () => clearInterval(id);
    } else {
      // Comment lines appear immediately
      const id = setTimeout(() => {
        setShownCount((n) => n + 1);
        setLineIndex((n) => n + 1);
      }, line.delay);
      return () => clearTimeout(id);
    }
  }, [lineIndex]);

  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="terminal-dot bg-brasa-700" />
        <span className="terminal-dot bg-brasa-500/60" />
        <span className="terminal-dot bg-brasa-300/40" />
        <span className="ml-3 font-mono text-xs">~/seu-projeto</span>
      </div>
      <div className="terminal-body min-h-[260px]">
        {LINES.slice(0, shownCount).map((l, i) => (
          <div key={i}>
            {l.kind === 'cmd' && (
              <div>
                <span className="terminal-prompt">$ </span>
                <span>{l.text}</span>
              </div>
            )}
            {l.kind === 'comment' && l.text && (
              <div className="terminal-comment">{l.text}</div>
            )}
            {l.kind === 'out' && <div className="terminal-output">{l.text}</div>}
          </div>
        ))}

        {/* Currently typing line */}
        {lineIndex >= 0 && lineIndex < LINES.length && LINES[lineIndex] && (
          <div>
            {LINES[lineIndex]!.kind === 'cmd' && (
              <div>
                <span className="terminal-prompt">$ </span>
                <span>{typedText}</span>
                <span className="terminal-cursor" />
              </div>
            )}
            {LINES[lineIndex]!.kind === 'out' && (
              <div className="terminal-output">
                {typedText}
                <span className="terminal-cursor" />
              </div>
            )}
            {LINES[lineIndex]!.kind === 'comment' && (
              <div className="terminal-comment">
                {typedText}
                <span className="terminal-cursor" />
              </div>
            )}
          </div>
        )}
        {lineIndex === -1 && (
          <div>
            <span className="terminal-prompt">$ </span>
            <span className="terminal-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}
