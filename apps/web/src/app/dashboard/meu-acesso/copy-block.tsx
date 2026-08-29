'use client';

import { useState } from 'react';

export function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group flex items-center gap-2 rounded border border-brasa-700/30 bg-bg/60 px-3 py-2 font-mono text-xs">
      <span className="flex-1 truncate text-fg">{text}</span>
      <button
        onClick={copy}
        className="shrink-0 rounded bg-brasa-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-brasa-300 hover:bg-brasa-500/30"
      >
        {copied ? 'copiado' : 'copiar'}
      </button>
    </div>
  );
}
