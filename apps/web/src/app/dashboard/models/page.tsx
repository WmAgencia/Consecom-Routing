import { requireSession, apiFetch } from '@/lib/api';

interface ModelsResponse {
  data: Array<{
    id: string;
    display_name: string;
    owned_by: string;
    available: boolean;
    capabilities: { maxContextTokens?: number; supportsVision?: boolean };
  }>;
}

export default async function ModelsPage() {
  await requireSession();
  const data = await apiFetch<ModelsResponse>('/v1/models').catch(() => ({ data: [] }));

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold">Modelos disponíveis</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Modelos que você pode usar com seu plano atual.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.data.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg border p-5 ${
              m.available
                ? 'border-fg-muted/15 bg-bg-panel'
                : 'border-fg-muted/10 bg-bg-panel/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-sm text-accent">{m.id}</div>
                <div className="mt-1 font-medium">{m.display_name}</div>
              </div>
              <span
                className={
                  m.available
                    ? 'rounded bg-success/15 px-2 py-0.5 text-xs text-success'
                    : 'rounded bg-fg-muted/15 px-2 py-0.5 text-xs text-fg-muted'
                }
              >
                {m.available ? 'Disponível' : 'Bloqueado no seu plano'}
              </span>
            </div>
            <div className="mt-4 flex gap-3 text-xs text-fg-muted">
              <span>provider: {m.owned_by}</span>
              {m.capabilities.maxContextTokens && (
                <span>{(m.capabilities.maxContextTokens / 1000).toFixed(0)}k ctx</span>
              )}
              {m.capabilities.supportsVision && <span>vision</span>}
            </div>
          </div>
        ))}
        {data.data.length === 0 && (
          <div className="col-span-2 rounded-lg border border-fg-muted/15 bg-bg-panel p-8 text-center text-fg-muted">
            Nenhum modelo disponível. Você precisa de uma assinatura ativa.
          </div>
        )}
      </div>
    </div>
  );
}
