'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function formatPlanDuration(hours: number): string {
  if (hours < 24) return `${hours}h`;
  const d = hours / 24;
  return d === 1 ? '1 dia' : `${d} dias`;
}

interface Plan {
  id: string;
  code: string;
  displayName: string;
  priceCents: number;
  durationHours: number;
  rateLimitPerMin: number;
  modelsAllowed: string[];
  active: boolean;
}

const ADMIN_COOKIE = '__consecom_admin';

async function getCookie(): Promise<string> {
  const m = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : '';
}

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookie = await getCookie();
  const res = await fetch(`http://localhost:3001${path}`, {
    ...init,
    headers: {
      ...init.headers,
      'Content-Type': 'application/json',
      cookie: `${ADMIN_COOKIE}=${cookie}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Activate plan
// ---------------------------------------------------------------------------
export function ActivatePlanForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await adminFetch<{ data: Plan[] }>('/v1/admin/plans');
      setPlans(data.data.filter((p) => p.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro ao carregar planos');
    }
  }

  async function submit() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await adminFetch(`/v1/admin/customers/${customerId}/activate-plan`, {
        method: 'POST',
        body: JSON.stringify({ planCode: selected }),
      });
      setOpen(false);
      setSelected('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro ao ativar plano');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          if (!plans) load();
        }}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Ativar / Renovar plano
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-fg-muted/20 bg-bg-panel p-6">
            <h2 className="text-lg font-semibold">Ativar plano manualmente</h2>
            <p className="mt-1 text-sm text-fg-muted">
              O pagamento será registrado como <code>manual</code>. O cliente ganha acesso pelo período do plano (uso ilimitado).
            </p>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="mt-4 w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">Selecione um plano…</option>
              {plans?.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.displayName} — R${(p.priceCents / 100).toFixed(2).replace('.', ',')} ·{' '}
                  {formatPlanDuration(p.durationHours)}
                </option>
              ))}
            </select>
            {error && (
              <div className="mt-3 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-fg-muted hover:text-fg"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={!selected || loading}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? 'Ativando…' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Create API key for customer
// ---------------------------------------------------------------------------
export function CreateKeyForCustomerButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ key: string; keyPrefix: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ key: string; keyPrefix: string }>(
        `/v1/admin/customers/${customerId}/api-keys`,
        {
          method: 'POST',
          body: JSON.stringify({ name: name.trim() }),
        },
      );
      setCreated({ key: data.key, keyPrefix: data.keyPrefix });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro ao criar key');
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setName('');
    setCreated(null);
    setError(null);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        + Gerar API Key
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-fg-muted/20 bg-bg-panel p-6">
            {!created ? (
              <>
                <h2 className="text-lg font-semibold">Gerar API Key para o cliente</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  A key será mostrada uma única vez. Entregue ao cliente por canal seguro.
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex.: produção OpenCode"
                  className="mt-4 w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  autoFocus
                />
                {error && (
                  <div className="mt-3 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                  </div>
                )}
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={close}
                    className="rounded-md px-4 py-2 text-sm text-fg-muted hover:text-fg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submit}
                    disabled={!name.trim() || loading}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {loading ? 'Criando…' : 'Criar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-success">API Key gerada</h2>
                <p className="mt-1 text-sm text-warn">
                  ⚠️ Copie agora. Por segurança, ela não será exibida novamente.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-md bg-bg p-4 font-mono text-xs">
                  {created.key}
                </pre>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(created.key)}
                    className="rounded-md border border-fg-muted/30 px-4 py-2 text-sm hover:border-fg-muted"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={close}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Revoke an API key
// ---------------------------------------------------------------------------
export function RevokeKeyButton({ keyId, keyPrefix }: { keyId: string; keyPrefix: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    if (!confirm(`Revogar a key ${keyPrefix}…? Esta ação não pode ser desfeita.`)) return;
    setLoading(true);
    setError(null);
    try {
      await adminFetch(`/v1/admin/api-keys/${keyId}/revoke`, { method: 'POST' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro ao revogar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={revoke}
        disabled={loading}
        className="text-xs text-danger hover:underline disabled:opacity-50"
      >
        {loading ? 'Revogando…' : 'Revogar'}
      </button>
      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm rounded border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}
    </>
  );
}