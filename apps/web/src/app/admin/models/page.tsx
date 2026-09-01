import { cookies } from 'next/headers';
import { requireAdmin } from '../_lib';

const ADMIN_COOKIE = '__consecom_admin';

interface ModelRow {
  id: string;
  code: string;
  displayName: string;
  providerId: string;
  inputPricePer1kCents: number;
  outputPricePer1kCents: number;
  status: string;
  capabilities?: {
    supportsTools?: boolean;
    supportsVision?: boolean;
    maxContextTokens?: number;
  };
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

export default async function AdminModels() {
  await requireAdmin();
  const data = await adminFetch<{ data: ModelRow[] }>('/v1/admin/models');

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="text-2xl font-semibold">Modelos</h1>
      <p className="mt-1 text-sm text-fg-muted">
        {data.data.length} {data.data.length === 1 ? 'modelo configurado' : 'modelos configurados'}
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Input / 1k</th>
              <th className="px-4 py-3">Output / 1k</th>
              <th className="px-4 py-3">Capacidades</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((m) => (
              <tr key={m.id} className="border-t border-fg-muted/10">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs">{m.code}</div>
                  <div className="mt-0.5 text-fg-muted">{m.displayName}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      m.status === 'active'
                        ? 'bg-success/15 text-success'
                        : 'bg-danger/15 text-danger'
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">
                  R$ {(m.inputPricePer1kCents / 100).toFixed(2).replace('.', ',')}
                </td>
                <td className="px-4 py-3 font-mono">
                  R$ {(m.outputPricePer1kCents / 100).toFixed(2).replace('.', ',')}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {m.capabilities?.supportsTools && (
                      <span className="rounded bg-bg-subtle px-1.5 py-0.5">tools</span>
                    )}
                    {m.capabilities?.supportsVision && (
                      <span className="rounded bg-bg-subtle px-1.5 py-0.5">vision</span>
                    )}
                    {m.capabilities?.maxContextTokens && (
                      <span className="rounded bg-bg-subtle px-1.5 py-0.5">
                        {(m.capabilities.maxContextTokens / 1000).toFixed(0)}k ctx
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
