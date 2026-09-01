import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  WHATSAPP_GROUP_URL,
  WHATSAPP_GROUP_CTA_LABEL,
  WHATSAPP_GROUP_GATE_MESSAGE,
} from '@/lib/whatsapp-group';

const SESSION_COOKIE = '__consecom_session';

const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

interface Subscription {
  id: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  expiresAt: string;
  plan: { code: string; displayName: string };
}

async function fetchSubscription(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  // Try the dedicated active endpoint first (when supported).
  try {
    const res = await fetch(`${API_BASE}/v1/billing/active`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json()) as { active: boolean };
      return data.active === true;
    }
  } catch {
    /* fall through */
  }

  // Fallback: infer active subscription from usage history.
  // If a user has usage records, they're using the API, which requires an
  // active subscription. This works around the /v1/billing/plan 404.
  try {
    const res = await fetch(`${API_BASE}/v1/usage?limit=1`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { data: unknown[] };
    return Array.isArray(data.data) && data.data.length > 0;
  } catch {
    return false;
  }
}

export default async function CommunityPage() {
  const isMember = await fetchSubscription();

  return (
    <main className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brasa-500 font-mono text-sm font-bold text-bg">
            C
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight">
            consecom/routing
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/#planos" className="rounded-md px-3 py-2 text-fg-muted hover:text-fg">
            Planos
          </Link>
          {isMember ? (
            <Link href="/dashboard" className="btn-ghost text-sm">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-ghost text-sm">
              Entrar
            </Link>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          grupo exclusivo de membros
        </div>

        <h1 className="font-serif text-5xl leading-[1.1] tracking-tight md:text-6xl">
          Comunidade{' '}
          <em className="text-brasa-500">Consecom Routing</em>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-fg-muted">
          Avisos de manutenção, novos modelos, dicas de uso e troca de
          experiências com outros assinantes. Receba em primeira mão tudo que
          entra na plataforma.
        </p>

        <div className="mt-10 inline-flex flex-col items-stretch gap-3 rounded-2xl border border-fg-muted/15 bg-bg-panel/60 p-8 text-left">
          <div className="flex items-center gap-3 text-sm">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brasa-700/30 text-brasa-300">
              ✓
            </span>
            <span>Suporte prioritário via grupo</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brasa-700/30 text-brasa-300">
              ✓
            </span>
            <span>Acesso antecipado a novos modelos Claude</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brasa-700/30 text-brasa-300">
              ✓
            </span>
            <span>Canal direto com a equipe Consecom</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brasa-700/30 text-brasa-300">
              ✓
            </span>
            <span>Enquetes de roadmap e features</span>
          </div>
        </div>

        <div className="mt-10">
          {isMember ? (
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brasa text-base"
            >
              {WHATSAPP_GROUP_CTA_LABEL}
            </a>
          ) : (
            <div className="space-y-3">
              <Link href="/#planos" className="btn-brasa inline-block text-base">
                {WHATSAPP_GROUP_CTA_LABEL}
              </Link>
              <p className="text-sm text-fg-muted">{WHATSAPP_GROUP_GATE_MESSAGE}</p>
            </div>
          )}
        </div>

        {isMember && (
          <p className="mt-6 text-xs text-fg-muted">
            Assinatura ativa — você tem acesso completo ao grupo.
          </p>
        )}
      </section>

      <footer className="border-t border-fg-muted/10 py-8 text-center text-xs text-fg-muted">
        © Consecom ·{' '}
        <code className="font-mono">POST /v1/messages</code> · Anthropic-compatible
      </footer>
    </main>
  );
}
