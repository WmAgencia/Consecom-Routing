'use client';

import { useState } from 'react';
import { WhatsAppGroupPopup } from './whatsapp-group-popup';
import {
  WHATSAPP_GROUP_URL,
  WHATSAPP_GROUP_CTA_LABEL,
} from '@/lib/whatsapp-group';

/**
 * Card exibido na página de billing para assinantes ativos.
 *
 * Mostra o link direto do grupo + botão que abre popup opcional com
 * confirmação.
 */
export function WhatsAppGroupCard({ active }: { active: boolean }) {
  const [showPopup, setShowPopup] = useState(false);

  if (!active) return null;

  return (
    <div className="mt-6 rounded-lg border border-success/40 bg-success/5 p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success/15 text-success">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M17.6 6.3A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.8 12L4 20l4.1-1.1a7.93 7.93 0 0 0 3.9 1h.01a7.93 7.93 0 0 0 5.6-13.6Zm-5.6 12.2h-.01a6.59 6.59 0 0 1-3.36-.92l-.24-.14-2.5.66.67-2.43-.16-.25a6.59 6.59 0 0 1 10.21-8.05 6.55 6.55 0 0 1 1.92 4.66 6.59 6.59 0 0 1-6.53 6.47Z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Grupo de membros WhatsApp</h3>
          <p className="mt-1 text-sm text-fg-muted">
            Você tem acesso ao grupo oficial de assinantes. Avisos de
            manutenção, novos modelos e troca direta com a equipe.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-success/40 px-3 py-1.5 text-sm font-medium text-success hover:bg-success/10"
            >
              {WHATSAPP_GROUP_CTA_LABEL}
            </a>
            <button
              type="button"
              onClick={() => setShowPopup(true)}
              className="rounded-md px-3 py-1.5 text-sm text-fg-muted hover:text-fg"
            >
              Ver detalhes
            </button>
          </div>
        </div>
      </div>

      {showPopup && <WhatsAppGroupPopup autoOpen />}
    </div>
  );
}
