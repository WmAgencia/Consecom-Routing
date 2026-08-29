import { apiFetch, requireSession } from '@/lib/api';
import type { ApiKeyPublic, ApiKeyCreated } from '@consecom/shared';
import { CreateKeyButton } from './create-button';

export default async function ApiKeysPage() {
  await requireSession();
  const data = await apiFetch<{ data: ApiKeyPublic[] }>('/v1/api-keys').catch(() => ({
    data: [],
  }));

  return (
    <div>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">API Keys</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Crie e revogue chaves de acesso para a API do Consecom Routing.
          </p>
        </div>
        <CreateKeyButton />
      </header>

      <div className="mt-8 overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Prefixo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Criada</th>
              <th className="px-4 py-3">Último uso</th>
              <th className="px-4 py-3">Requests</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fg-muted">
                  Você ainda não tem API Keys. Clique em &quot;Criar API Key&quot;.
                </td>
              </tr>
            )}
            {data.data.map((k) => (
              <tr key={k.id} className="border-t border-fg-muted/10">
                <td className="px-4 py-3 font-medium">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{k.keyPrefix}••••••••</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      k.status === 'active'
                        ? 'text-success'
                        : k.status === 'revoked'
                          ? 'text-danger'
                          : 'text-warn'
                    }
                  >
                    {k.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {new Date(k.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {k.lastUsedAt
                    ? new Date(k.lastUsedAt).toLocaleString('pt-BR')
                    : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {k.requestCount.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right">
                  {k.status === 'active' && <RevokeButton id={k.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevokeButton({ id }: { id: string }) {
  return (
    <form action={`/v1/api-keys/${id}`} method="post">
      <input type="hidden" name="_method" value="DELETE" />
      <button
        type="submit"
        className="text-xs text-danger hover:underline"
        formAction={`/v1/api-keys/${id}`}
        formMethod="delete"
      >
        Revogar
      </button>
    </form>
  );
}
