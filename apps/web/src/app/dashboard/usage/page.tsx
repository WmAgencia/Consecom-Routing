import { requireSession, apiFetch } from '@/lib/api';

interface UsageResponse {
  data: Array<{
    requestId: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    creditsConsumed: number;
    costCents: number;
    latencyMs: number;
    status: string;
    errorCode: string | null;
    createdAt: string;
  }>;
  balance: { available: number; reserved: number; used: number };
}

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; status?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const limit = Math.min(Number(sp.limit ?? 100), 200);
  const status = sp.status;

  const url = `/v1/usage?limit=${limit}${status ? `&status=${status}` : ''}`;
  const data = await apiFetch<UsageResponse>(url).catch(() => ({
    data: [],
    balance: { available: 0, reserved: 0, used: 0 },
  }));

  const totalTokens = data.data.reduce((s, e) => s + e.totalTokens, 0);
  const totalCredits = data.data.reduce((s, e) => s + e.creditsConsumed, 0);
  const totalCostCents = data.data.reduce((s, e) => s + e.costCents, 0);

  return (
    <div>
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Uso</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Histórico de todas as requisições à API.
          </p>
        </div>
        <div className="flex gap-2">
          <FilterChip label="Todos" href="/dashboard/usage" active={!status} />
          <FilterChip label="Sucesso" href="/dashboard/usage?status=success" active={status === 'success'} />
          <FilterChip label="Erros" href="/dashboard/usage?status=error" active={status === 'error'} />
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <SmallStat label="Requests" value={data.data.length.toString()} />
        <SmallStat label="Tokens" value={totalTokens.toLocaleString('pt-BR')} />
        <SmallStat label="Créditos" value={totalCredits.toLocaleString('pt-BR')} />
        <SmallStat label="Custo" value={`$${(totalCostCents / 100).toFixed(2)}`} />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Request ID</th>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Tokens</th>
              <th className="px-4 py-3">Créditos</th>
              <th className="px-4 py-3">Latência</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-fg-muted">
                  Nenhuma requisição registrada ainda.
                </td>
              </tr>
            )}
            {data.data.map((e) => (
              <tr key={e.requestId} className="border-t border-fg-muted/10">
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {e.requestId.slice(0, 14)}…
                </td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {new Date(e.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3">{e.totalTokens.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3">{e.creditsConsumed.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3">{e.latencyMs}ms</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      e.status === 'success'
                        ? 'text-success'
                        : e.status === 'error'
                          ? 'text-danger'
                          : 'text-warn'
                    }
                  >
                    {e.status}
                    {e.errorCode && (
                      <span className="ml-2 font-mono text-xs text-fg-muted">
                        {e.errorCode}
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-md px-3 py-1.5 text-xs ${
        active
          ? 'bg-accent text-white'
          : 'border border-fg-muted/20 text-fg-muted hover:border-fg-muted'
      }`}
    >
      {label}
    </a>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-fg-muted/15 bg-bg-panel/50 p-3">
      <div className="text-xs text-fg-muted">{label}</div>
      <div className="mt-1 font-mono text-lg">{value}</div>
    </div>
  );
}
