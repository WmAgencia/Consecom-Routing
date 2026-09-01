'use client';

import { useEffect, useState } from 'react';
import {
  WHATSAPP_GROUP_URL,
  WHATSAPP_GROUP_CTA_LABEL,
} from '@/lib/whatsapp-group';

const STORAGE_KEY = 'whatsapp_group_popup_dismissed';

interface Props {
  /** Quando true, mostra o popup automaticamente (ex: após checkout). */
  autoOpen?: boolean;
}

/**
 * Modal de entrada para o grupo de membros do WhatsApp.
 *
 * Comportamento:
 * - Se autoOpen=true, abre sozinho na renderização.
 * - Caso contrário, abre quando o usuário clica no botão "Entrar no grupo".
 * - Salva no localStorage quando o usuário fecha, para não mostrar de novo
 *   na mesma sessão/aba (a menos que autoOpen=true force re-exibição).
 */
export function WhatsAppGroupPopup({ autoOpen = false }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      // Força abertura após checkout, ignorando dismissal.
      setOpen(true);
    } else {
      // Listener para botão "Entrar no grupo" — abre sob demanda.
      const handler = () => setOpen(true);
      window.addEventListener('open-whatsapp-popup', handler);
      return () => window.removeEventListener('open-whatsapp-popup', handler);
    }
  }, [autoOpen]);

  function handleDismiss() {
    if (!autoOpen) {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* localStorage pode estar bloqueado, tudo bem */
      }
    }
    setOpen(false);
  }

  function handleJoin() {
    window.open(WHATSAPP_GROUP_URL, '_blank', 'noopener,noreferrer');
    handleDismiss();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-group-title"
    >
      <div className="w-full max-w-md rounded-xl border border-fg-muted/15 bg-bg-panel p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-success/15 text-success">
            {/* WhatsApp icon */}
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M17.6 6.3A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.8 12L4 20l4.1-1.1a7.93 7.93 0 0 0 3.9 1h.01a7.93 7.93 0 0 0 5.6-13.6Zm-5.6 12.2h-.01a6.59 6.59 0 0 1-3.36-.92l-.24-.14-2.5.66.67-2.43-.16-.25a6.59 6.59 0 0 1 10.21-8.05 6.55 6.55 0 0 1 1.92 4.66 6.59 6.59 0 0 1-6.53 6.47Zm3.62-4.94c-.2-.1-1.18-.58-1.36-.65-.18-.07-.32-.1-.45.1-.13.2-.51.65-.63.78-.12.13-.23.15-.43.05a5.42 5.42 0 0 1-1.6-.99 6 6 0 0 1-1.1-1.37c-.12-.2 0-.3.08-.4.08-.09.18-.23.27-.34.09-.12.12-.2.18-.33.06-.13.03-.25-.02-.35-.05-.1-.45-1.08-.62-1.48-.16-.39-.33-.34-.45-.34h-.38a.74.74 0 0 0-.53.25 2.24 2.24 0 0 0-.7 1.67c0 .99.72 1.95.82 2.08.1.13 1.41 2.16 3.42 3.03.48.21.85.33 1.14.43.48.15.92.13 1.26.08.39-.06 1.18-.48 1.34-.95.17-.46.17-.86.12-.95-.05-.09-.18-.14-.38-.24Z" />
            </svg>
          </div>
          <h2 id="wa-group-title" className="font-serif text-xl">
            Bem-vindo ao grupo! 🎉
          </h2>
        </div>

        <p className="text-sm text-fg-muted">
          Sua assinatura está ativa. Entre agora no grupo oficial de membros do
          Consecom Routing para receber avisos de manutenção, novos modelos,
          dicas de uso e troca de experiências com outros assinantes.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md border border-fg-muted/30 px-4 py-2 text-sm font-medium text-fg-muted hover:border-fg-muted"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={handleJoin}
            className="btn-brasa text-sm"
          >
            {WHATSAPP_GROUP_CTA_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
