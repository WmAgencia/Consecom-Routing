import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { NewCustomerButton } from './new-button';

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

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function timeUntil(iso: string | null): string {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expirado';
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

export default async function AdminCustomersPage() {
  let rows: CustomerRow[] = [];
  try {
    const res = await apiFetch<{ data: CustomerRow[] }>('/v1/admin/customers');
    rows = res.data;
  } catch {
    rows = [];
  }

  return (
    <div className="max-w-6xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {rows.length} cliente{rows.length !== 1 ? 's' : ''} cadastrado{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <NewCustomerButton />
      </header>

      <div className="overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Créditos</th>
              <th className="px-4 py-3">Expira</th>
              <th className="px-4 py-3">Criado</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-fg-muted">
                  Nenhum cliente cadastrado. Crie o primeiro →
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-t border-fg-muted/10 hover:bg-bg-panel/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-fg-muted">{c.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">
                      {c.planCode ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.customerStatus === 'active'
                          ? 'rounded bg-success/15 px-2 py-0.5 text-xs text-success'
                          : c.customerStatus === 'suspended'
                            ? 'rounded bg-warn/15 px-2 py-0.5 text-xs text-warn'
                            : 'rounded bg-danger/15 px-2 py-0.5 text-xs text-danger'
                      }
                    >
                      {c.customerStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {c.creditsAvailable.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {timeUntil(c.expiresAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="text-xs text-brasa-500 hover:underline"
                    >
                      gerenciar →
                    </Link>
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
