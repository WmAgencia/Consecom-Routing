'use client';

import { useState } from 'react';
import {
  WHATSAPP_GROUP_URL,
  WHATSAPP_GROUP_CTA_LABEL,
  WHATSAPP_GROUP_GATE_MESSAGE,
} from '@/lib/whatsapp-group';

interface Props {
  /** Se true, exibe o botão desabilitado com a mensagem de gate. */
  gated: boolean;
  /** Variante visual do botão. */
  variant?: 'brasil' | 'ghost';
}

/**
 * Botão "Entrar no grupo de membros".
 *
 * Comportamento:
 * - Assinante (gated=false): abre link em nova aba + dispara popup opcional.
 * - Não-assinante (gated=true): mostra mensagem de gate apontando para /#planos.
 */
export function WhatsAppGroupButton({ gated, variant = 'brasil' }: Props) {
  const [clicked, setClicked] = useState(false);

  if (gated) {
    return (
      <div className="space-y-2">
        <a
          href="#planos"
          className={variant === 'brasil' ? 'btn-brasa w-full' : 'btn-ghost w-full'}
        >
          {WHATSAPP_GROUP_CTA_LABEL}
        </a>
        <p className="text-center text-xs text-fg-muted">{WHATSAPP_GROUP_GATE_MESSAGE}</p>
      </div>
    );
  }

  function handleClick() {
    if (clicked) return;
    setClicked(true);
    // Abre o popup opcional também — usuário pode decidir se quer entrar agora
    // ou fechar.
    window.dispatchEvent(new CustomEvent('open-whatsapp-popup'));
  }

  return (
    <a
      href={WHATSAPP_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={variant === 'brasil' ? 'btn-brasa w-full' : 'btn-ghost w-full'}
    >
      {WHATSAPP_GROUP_CTA_LABEL}
    </a>
  );
}
