import { cookies } from 'next/headers';
import { requireAdmin } from '../_lib';

const ADMIN_COOKIE = '__consecom_admin';

interface AuditLogRow {
  id: string;
  adminUserId: string;
  adminEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

async function adminFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE)?.value ?? '';
  const base = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${base}${path}`, {
    headers: { cookie: `${ADMIN_COOKIE}=${cookie}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTION_COLORS: Record<string, string> = {
  credits_adjust: 'bg-warning/15 text-warning',
  toggle_active: 'bg-accent/15 text-accent',
  login: 'bg-fg-muted/15 text-fg-muted',
  create: 'bg-success/15 text-success',
  revoke: 'bg-danger/15 text-danger',
};

export default async function AdminAuditLogs() {
  await requireAdmin();
  const data = await adminFetch<{ data: AuditLogRow[] }>('/v1/admin/audit-logs');

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Histórico de ações administrativas • {data.data.length}{' '}
        {data.data.length === 1 ? 'evento' : 'eventos'}
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Alvo</th>
              <th className="px-4 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((log) => {
              const colorClass = ACTION_COLORS[log.action] ?? 'bg-fg-muted/15 text-fg-muted';
              const meta = log.metadata ?? {};
              const metaText =
                Object.keys(meta).length > 0
                  ? Object.entries(meta)
                      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                      .join(', ')
                  : '—';
              return (
                <tr key={log.id} className="border-t border-fg-muted/10">
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {(meta.adminEmail as string) ?? log.adminEmail ?? log.adminUserId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 font-mono text-xs ${colorClass}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {log.targetType}:{log.targetId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {metaText.length > 80 ? `${metaText.slice(0, 80)}…` : metaText}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
