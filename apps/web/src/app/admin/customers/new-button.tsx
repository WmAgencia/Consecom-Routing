'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Plan {
  id: string;
  code: string;
  displayName: string;
  priceCents: number;
  durationHours: number;
  active: boolean;
}

interface CreatedCustomer {
  customer: { id: string; email: string; name: string; status: string };
  password: string;
  activatedSubscription: {
    subscription: { id: string; expiresAt: string };
    apiKey: { key: string; id: string; keyPrefix: string } | null;
  } | null;
}

export function NewCustomerButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [planCode, setPlanCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCustomer | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch('/v1/admin/plans', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setPlans((d.data ?? []).filter((p: Plan) => p.active)))
      .catch(() => setPlans([]));
  }, [open]);

  function reset() {
    setEmail('');
    setName('');
    setPassword('');
    setPlanCode('');
    setError(null);
    setCreated(null);
    setCopied(false);
  }

  function closeModal() {
    setOpen(false);
    reset();
    router.refresh();
  }

  function generatePassword() {
    const random = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setPassword(random);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/v1/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          name,
          password,
          planCode: planCode || undefined,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        setError(txt || 'Erro ao criar cliente');
        setLoading(false);
        return;
      }
      const data: Omit<CreatedCustomer, 'password'> = await res.json();
      setCreated({ ...data, password });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede');
      setLoading(false);
    }
  }

  async function copyCredentials() {
    if (!created) return;
    const text = [
      `Email: ${created.customer.email}`,
      `Senha: ${created.password}`,
      created.activatedSubscription?.apiKey
        ? `API Key: ${created.activatedSubscription.apiKey.key}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        + Novo Cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-fg-muted/20 bg-bg-panel p-6">
            {!created ? (
              <>
                <h2 className="font-serif text-xl">Criar Cliente</h2>
                <p className="mt-1 text-xs text-fg-muted">
                  Crie uma conta com plano opcional. As credenciais serão mostradas uma única vez.
                </p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-fg-muted">
                      Nome
                    </label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-fg-muted">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-fg-muted">
                      Senha inicial
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        required
                        type="text"
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="rounded-md border border-fg-muted/20 px-3 py-2 text-xs hover:border-accent"
                      >
                        Gerar
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-fg-muted">
                      Plano (opcional)
                    </label>
                    <select
                      value={planCode}
                      onChange={(e) => setPlanCode(e.target.value)}
                      className="mt-1 w-full rounded-md border border-fg-muted/20 bg-bg px-3 py-2 text-sm"
                    >
                      <option value="">— Sem plano (ativar depois) —</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.code}>
                          {p.displayName} (R$ {(p.priceCents / 100).toFixed(2)} · {p.durationHours}h)
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
                      {error}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 rounded-md border border-fg-muted/20 px-4 py-2 text-sm hover:border-fg-muted"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                    >
                      {loading ? 'Criando...' : 'Criar Cliente'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="font-serif text-xl">Cliente Criado ✓</h2>
                <p className="mt-1 text-xs text-fg-muted">
                  Copie as credenciais — <strong className="text-danger">não serão mostradas novamente</strong>.
                </p>

                <div className="mt-4 space-y-3 rounded-md border border-fg-muted/15 bg-bg p-4 font-mono text-xs">
                  <div>
                    <div className="text-fg-muted">Email</div>
                    <div>{created.customer.email}</div>
                  </div>
                  <div>
                    <div className="text-fg-muted">Senha</div>
                    <div>{created.password}</div>
                  </div>
                  {created.activatedSubscription?.apiKey && (
                    <div>
                      <div className="text-fg-muted">API Key (mostrada uma vez)</div>
                      <div className="break-all">{created.activatedSubscription.apiKey.key}</div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={copyCredentials}
                    className="flex-1 rounded-md border border-fg-muted/20 px-4 py-2 text-sm hover:border-accent"
                  >
                    {copied ? 'Copiado!' : 'Copiar tudo'}
                  </button>
                  <Link
                    href={`/admin/customers/${created.customer.id}`}
                    onClick={closeModal}
                    className="flex-1 rounded-md bg-accent px-4 py-2 text-center text-sm font-medium text-white hover:bg-accent-hover"
                  >
                    Ver cliente →
                  </Link>
                </div>
                <button
                  onClick={closeModal}
                  className="mt-2 w-full text-xs text-fg-muted hover:text-fg"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
