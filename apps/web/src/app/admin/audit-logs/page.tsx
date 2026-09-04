import { apiFetch } from '@/lib/api';

interface AuditLog {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export default async function AdminAuditLogsPage() {
  let rows: AuditLog[] = [];
  try {
    const res = await apiFetch<{ data: AuditLog[] }>('/v1/admin/audit-logs');
    rows = res.data;
  } catch {
    rows = [];
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Últimas {rows.length} ações administrativas (read-only)
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Alvo</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-fg-muted">
                  Sem ações registradas
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-fg-muted/10">
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {new Date(r.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.action}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.targetType} · {r.targetId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {r.adminUserId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {r.metadata ? JSON.stringify(r.metadata).slice(0, 80) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
