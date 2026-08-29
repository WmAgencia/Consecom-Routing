import { requireSession, apiFetch } from '@/lib/api';
import type { Plan, Subscription, ApiKeyPublic, User } from '@consecom/shared';
import { AccessSetup } from './access-setup';

function formatPlanDuration(hours: number): string {
  if (hours < 24) return `${hours}h`;
  const d = hours / 24;
  return d === 1 ? '1 dia' : `${d} dias`;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}

function formatRemaining(expiresAt: string | Date): Remaining {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
  const totalMinutes = Math.floor(ms / 60_000);
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
    expired: false,
  };
}

interface SubWithPlan {
  subscription: Subscription;
  plan: Plan;
}

export default async function MeuAcessoPage() {
  const user: User = await requireSession();

  const [subRes, keysRes] = await Promise.all([
    apiFetch<SubWithPlan | null>('/v1/billing/plan').catch(() => null),
    apiFetch<{ data: ApiKeyPublic[] }>('/v1/api-keys').catch(() => ({
      data: [] as ApiKeyPublic[],
    })),
  ]);

  const sub = subRes;
  const plan = sub?.plan ?? null;
  const expiresAt = sub?.subscription?.expiresAt;
  const rem: Remaining | null = expiresAt ? formatRemaining(expiresAt) : null;
  const activeKey = keysRes.data.find((k) => k.status === 'active');

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? 'https://api.routing.consecom.com.br';
  const proxyUrl = `${apiBase}/v1`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-brasa-500">
          seu claude code
        </div>
        <h1 className="mt-2 font-serif text-4xl tracking-tight">
          Acompanhe seu acesso e configure em três passos.
        </h1>
      </header>

      {sub && plan && rem && !rem.expired ? (
        <AccessSetup
          planName={plan.displayName}
          planCode={plan.code}
          durationLabel={formatPlanDuration(plan.durationHours)}
          days={rem.days}
          hours={rem.hours}
          minutes={rem.minutes}
          keyPrefix={activeKey?.keyPrefix ?? null}
          apiUrl={proxyUrl}
        />
      ) : (
        <div className="rounded-xl border border-fg-muted/15 bg-bg-panel p-8 text-center">
          <h2 className="font-serif text-2xl">Você ainda não tem plano ativo.</h2>
          <p className="mt-2 text-fg-muted">
            Escolha um plano na página de billing e peça a ativação ao admin.
          </p>
          <a href="/dashboard/billing" className="btn-brasa mt-6 inline-flex">
            Ver planos
          </a>
        </div>
      )}

      {activeKey && (
        <section className="mt-10 rounded-xl border border-fg-muted/10 bg-bg-panel p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-fg-muted">
                Sua key
              </div>
              <div className="mt-1 font-mono text-sm">
                {activeKey.keyPrefix}••••••••••••
              </div>
            </div>
            <span className="rounded bg-success/15 px-2 py-0.5 text-xs text-success">
              ativa
            </span>
          </div>
          <p className="mt-3 text-xs text-fg-muted">
            A key completa foi mostrada uma única vez no momento da criação.
            Se você perdeu, revogue e gere uma nova no painel de API Keys.
          </p>
          <a
            href="/dashboard/api-keys"
            className="mt-4 inline-block text-sm text-brasa-500 hover:text-brasa-300"
          >
            Gerenciar keys →
          </a>
        </section>
      )}

      <footer className="mt-12 text-xs text-fg-muted">
        Logado como <span className="font-mono">{user.email}</span>
      </footer>
    </div>
  );
}
