import { cookies } from 'next/headers';
import { requireAdmin } from '../_lib';

const ADMIN_COOKIE = '__consecom_admin';

interface CustomerRow {
  id: string;
  email: string;
  name: string;
  status: string;
  customerStatus: string;
  createdAt: string;
  planCode: string | null;
  subscriptionStatus: string | null;
  expiresAt: string | null;
  creditsAvailable: number;
  creditsUsed: number;
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

export default async function AdminCustomers() {
  await requireAdmin();
  const data = await adminFetch<{ data: CustomerRow[] }>('/v1/admin/customers');

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <p className="mt-1 text-sm text-fg-muted">
        {data.data.length} {data.data.length === 1 ? 'cliente' : 'clientes'}
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expira</th>
              <th className="px-4 py-3">Créditos</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((c) => (
              <tr key={c.id} className="border-t border-fg-muted/10">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="font-mono text-xs text-fg-muted">{c.email}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{c.planCode ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.customerStatus} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {c.creditsAvailable.toLocaleString('pt-BR')} disp.
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/admin/customers/${c.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    detalhes
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-success/15 text-success',
    suspended: 'bg-danger/15 text-danger',
    banned: 'bg-danger/15 text-danger',
    pending: 'bg-warn/15 text-warn',
  };
  const cls = map[status] ?? 'bg-fg-muted/15 text-fg-muted';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}
