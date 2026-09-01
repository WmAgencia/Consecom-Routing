'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WhatsAppGroupPopup } from '@/app/_components/whatsapp-group-popup';

/**
 * Self-service checkout is temporarily disabled — plans moved to a
 * time-based unlimited model that doesn't fit Stripe's standard checkout.
 * Activation is now handled by the admin via the Master Panel.
 *
 * UX adicional:
 * - Após o checkout bem-sucedido (data.success === true), abre o popup do
 *   grupo de membros do WhatsApp para o usuário entrar.
 */
export function CheckoutButton({ planCode: _planCode }: { planCode: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);

  // Renderiza o popup apenas quando o usuário acabou de pagar.
  useEffect(() => {
    if (justPaid) {
      // Pequeno delay para garantir que a UI de sucesso apareceu antes do modal.
      const t = setTimeout(() => {
        // Não setamos state aqui — o popup lê de justPaid como autoOpen.
      }, 100);
      return () => clearTimeout(t);
    }
  }, [justPaid]);

  async function request() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planCode: _planCode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.success || data.type === 'pix' || data.qrCode) {
        // PIX gerado — mostra popup do grupo após atualização.
        setJustPaid(true);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-5">
        <button
          onClick={request}
          disabled={loading}
          className="w-full rounded-md border border-fg-muted/30 px-4 py-2 text-sm font-medium text-fg-muted hover:border-fg-muted disabled:opacity-50"
        >
          {loading ? 'Processando…' : 'Solicitar ativação ao admin'}
        </button>
        {error && (
          <div className="mt-2 rounded border border-warn/40 bg-warn/10 px-2 py-1 text-xs text-warn">
            {error}
          </div>
        )}
      </div>
      <WhatsAppGroupPopup autoOpen={justPaid} />
    </>
  );
}