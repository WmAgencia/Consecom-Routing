import { apiFetch, requireSession } from '@/lib/api';
import type { ApiKeyPublic } from '@consecom/shared';
import { CreateKeyButton } from './create-button';

export default async function ApiKeysPage() {
  await requireSession();
  const data = await apiFetch<{ data: ApiKeyPublic[] }>('/v1/api-keys').catch(() => ({
    data: [],
  }));

  const activeCount = data.data.filter((k) => k.status === 'active').length;
  const totalRequests = data.data.reduce((s, k) => s + k.requestCount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="animate-fade-up flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-fg">API Keys</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Crie e revogue chaves de acesso para a API do Consecom Routing.
          </p>
        </div>
        <CreateKeyButton />
      </header>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniStat label="Chaves ativas" value={activeCount.toString()} accent={activeCount > 0} />
        <MiniStat label="Total" value={data.data.length.toString()} />
        <MiniStat label="Requisições" value={totalRequests.toLocaleString('pt-BR')} />
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-white/5 bg-bg-panel/40 backdrop-blur-xl">
        {data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brasa-500/20 to-brasa-700/10">
              <KeyIcon className="h-7 w-7 text-accent" />
            </div>
            <h3 className="font-serif text-lg text-fg">Nenhuma API Key ainda</h3>
            <p className="mt-1 max-w-sm text-sm text-fg-muted">
              Crie sua primeira chave para começar a fazer chamadas à API. A chave completa
              será mostrada apenas uma vez.
            </p>
            <CreateKeyButton />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-left text-[10px] uppercase tracking-widest text-fg-muted">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Prefixo</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Criada</th>
                <th className="px-5 py-3">Último uso</th>
                <th className="px-5 py-3 text-right">Requests</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((k) => (
                <tr
                  key={k.id}
                  className="border-t border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4 font-medium text-fg">{k.name}</td>
                  <td className="px-5 py-4">
                    <code className="rounded-md bg-bg-subtle px-2 py-0.5 font-mono text-xs text-fg-muted">
                      {k.keyPrefix}••••••••
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={k.status} />
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-fg-muted">
                    {new Date(k.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-fg-muted">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-xs text-fg">
                    {k.requestCount.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {k.status === 'active' && <RevokeButton id={k.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="rounded-2xl border border-brasa-500/20 bg-gradient-to-br from-brasa-500/5 to-transparent p-6">
        <h3 className="font-serif text-base text-fg">Como usar</h3>
        <p className="mt-1 text-sm text-fg-muted">
          Envie a chave no header <code className="rounded bg-bg-subtle px-1.5 py-0.5 text-xs">Authorization</code>:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-bg/80 p-4 font-mono text-xs text-fg-muted">
{`curl -X POST https://api.consecom.com.br/v1/chat/completions \\
  -H "Authorization: Bearer ${data.data[0]?.keyPrefix ?? 'sk_cr_live_'}..." \\
  -H "Content-Type: application/json" \\
  -d '{"model":"claude-haiku-4-5-puter","messages":[{"role":"user","content":"oi"}]}'`}
        </pre>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-bg-panel/40 px-4 py-3 backdrop-blur-xl">
      <div className="text-[10px] uppercase tracking-widest text-fg-muted">{label}</div>
      <div className={`mt-1 font-serif text-xl ${accent ? 'text-accent' : 'text-fg'}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    active: { bg: 'bg-success/15', fg: 'text-success', label: '● Ativa' },
    revoked: { bg: 'bg-danger/15', fg: 'text-danger', label: '● Revogada' },
    expired: { bg: 'bg-warn/15', fg: 'text-warn', label: '● Expirada' },
  };
  const s = map[status] ?? { bg: 'bg-fg-muted/15', fg: 'text-fg-muted', label: status };
  return (
    <span className={`inline-flex items-center rounded-full ${s.bg} ${s.fg} px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider`}>
      {s.label}
    </span>
  );
}

function RevokeButton({ id }: { id: string }) {
  return (
    <form action={`/v1/api-keys/${id}`} method="post">
      <input type="hidden" name="_method" value="DELETE" />
      <button
        type="submit"
        className="rounded-lg border border-danger/30 px-3 py-1 text-xs text-danger transition hover:bg-danger/10"
        formAction={`/v1/api-keys/${id}`}
        formMethod="delete"
      >
        Revogar
      </button>
    </form>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="15" r="4" />
      <path d="M10.85 12.15L19 4M15 8l2 2M18 5l2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
