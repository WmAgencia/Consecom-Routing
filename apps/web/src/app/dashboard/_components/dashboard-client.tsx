'use client';

import { useState } from 'react';
import type { ApiKeyPublic } from '@consecom/shared';
import { CreateKeyButton } from '../api-keys/create-button';

interface Props {
  keys: ApiKeyPublic[];
  apiUrl: string;
}

export function DashboardClient({ keys, apiUrl }: Props) {
  const [copiedShare, setCopiedShare] = useState(false);

  const activeKeys = keys.filter((k) => k.status === 'active');
  const [copiedKey, setCopiedKey] = useState<Record<string, boolean>>({});

  async function copyKey(id: string, key: string) {
    await navigator.clipboard.writeText(key);
    setCopiedKey((p) => ({ ...p, [id]: true }));
    setTimeout(() => setCopiedKey((p) => ({ ...p, [id]: false })), 1500);
  }

  async function shareLink() {
    // TODO: replace with real referral link from /v1/referral endpoint
    const referralUrl = `${window.location.origin}/auth/register?ref=${encodeURIComponent(
      'meu-codigo',
    )}`;
    await navigator.clipboard.writeText(referralUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 1500);
  }

  return (
    <>
      {/* SUAS CHAVES */}
      <section id="suas-chaves" className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
            Suas chaves
          </h2>
          <CreateKeyButton />
        </div>

        {keys.length === 0 ? (
          <div className="mt-4 rounded-lg border border-fg-muted/15 bg-bg-panel p-8 text-center">
            <p className="text-sm text-fg-muted">
              Nenhuma key criada ainda.{' '}
              <button
                onClick={() => document.querySelector<HTMLButtonElement>('[data-create-btn]')?.click()}
                className="text-accent hover:underline"
              >
                Criar a primeira →
              </button>
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-fg-muted/15">
            <table className="w-full text-sm">
              <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
                <tr>
                  <th className="px-4 py-3">Prefixo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criada</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-t border-fg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs">
                      {k.keyPrefix}••••••••••
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          k.status === 'active'
                            ? 'rounded bg-success/15 px-2 py-0.5 text-xs text-success'
                            : k.status === 'revoked'
                              ? 'rounded bg-danger/15 px-2 py-0.5 text-xs text-danger'
                              : 'rounded bg-warn/15 px-2 py-0.5 text-xs text-warn'
                        }
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                      {new Date(k.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => copyKey(k.id, k.keyPrefix)}
                        className="mr-2 text-xs text-fg-muted hover:text-fg"
                      >
                        {copiedKey[k.id] ? 'copiado!' : 'copiar prefixo'}
                      </button>
                      {k.status === 'active' && (
                        <form
                          method="post"
                          action={`/v1/api-keys/${k.id}`}
                          className="inline"
                        >
                          <input type="hidden" name="_method" value="DELETE" />
                          <button
                            type="submit"
                            formMethod="post"
                            className="text-xs text-danger hover:underline"
                          >
                            revogar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* META DE INDICAÇÃO — right side interactive parts */}
      <div className="hidden" aria-hidden>
        {/* Hidden anchor for scroll target */}
        <span id="scroll-suas-chaves" />
      </div>

      {/* CLAUDE CODE ATIVO */}
      <section className="mt-8 rounded-xl border border-fg-muted/15 bg-bg-panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              Conectado
            </span>
            <span className="font-mono text-sm text-fg-muted">{apiUrl}</span>
          </div>
          <a
            href="#suas-chaves"
            className="inline-flex items-center gap-2 rounded-md border border-fg-muted/20 px-4 py-2 text-sm hover:border-brasa-500 hover:text-brasa-500"
          >
            Ver minha chave
          </a>
        </div>
      </section>

      {/* BAIXAR A EXTENSÃO */}
      <section className="mt-6 rounded-xl border border-fg-muted/15 bg-bg-panel p-6">
        <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
          <div>
            <h2 className="font-serif text-xl">Baixe a extensão</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Versão <span className="font-mono">v0.4.2</span> · 12 MB
            </p>
            <p className="mt-3 text-xs text-fg-muted">
              Interface web completa no seu navegador. Instale em 1 clique.
            </p>
          </div>
          <div className="flex justify-start sm:justify-end">
            <a
              href="/downloads/consecom-extensao.dmg"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0 0-1.03l-2.955-3.125V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 1-1.5 0V2.75C2 2.254 2.254 2 2.75 2h5.5A.75.75 0 0 1 9 2v10a.75.75 0 0 1-1.5 0V9h-2v3.75a.75.75 0 0 1-1.5 0V9H6v2.25a.75.75 0 0 1-1.5 0V12Z" />
              </svg>
              Baixar agora
            </a>
          </div>
        </div>
      </section>

      {/* META DE INDICAÇÃO — full card */}
      <section className="mt-6 rounded-xl border border-fg-muted/15 bg-bg-panel p-6">
        <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
          {/* Left: pitch */}
          <div>
            <div className="flex items-center gap-2 text-brasa-500">
              <span className="text-xl" role="img" aria-label="presente">
                🎁
              </span>
              <h2 className="font-serif text-xl">Indique e ganhe</h2>
            </div>
            <p className="mt-2 text-sm text-fg-muted">
              Cada amigo indicado = <strong className="text-fg">1 key extra</strong> de
              200 créditos automaticamente. Acumule até 5 keys.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="font-mono text-xs text-fg-muted">auto-1key</span>
              <span className="rounded bg-brasa-500/15 px-2 py-0.5 text-xs font-medium text-brasa-500">
                200 créditos
              </span>
            </div>
          </div>

          {/* Right: progress + share */}
          <div>
            {/* Placeholder: 0/5 amigos */}
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-fg-muted">0/5 amigos</span>
              <span className="font-mono text-xs text-fg-muted">0%</span>
            </div>
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-fg-muted/10">
              <div className="h-full w-0 rounded-full bg-brasa-500" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded border border-fg-muted/20 bg-bg px-3 py-2 font-mono text-xs text-fg-muted">
                {typeof window !== 'undefined'
                  ? `${window.location.origin}/auth/register?ref=seu-codigo`
                  : 'consecom-routing.com/auth/register?ref=...'}
              </div>
              <button
                onClick={shareLink}
                className="shrink-0 rounded-md bg-brasa-500 px-4 py-2 text-sm font-medium text-white hover:bg-brasa-600"
              >
                {copiedShare ? 'Copiado!' : 'Compartilhar'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
