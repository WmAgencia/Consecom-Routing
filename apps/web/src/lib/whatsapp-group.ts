/**
 * Link do grupo oficial de membros no WhatsApp.
 *
 * Acesso: somente para clientes com assinatura ativa (validado via
 * `/v1/billing/plan` que retorna `subscription.status === 'active'`).
 *
 * Compartilhar este link publicamente é OK — o gating é feito no app, não
 * no link. Se alguém não-assinante entrar no grupo, basta remover manualmente.
 */
export const WHATSAPP_GROUP_URL =
  'https://chat.whatsapp.com/CfuVoOhAyHWBK93bzNxIva';

/**
 * Texto mostrado no botão/banner de chamada para o grupo.
 */
export const WHATSAPP_GROUP_CTA_LABEL = 'Entrar no grupo de membros';

/**
 * Mensagem exibida para visitantes NÃO assinantes.
 * Mostra que o grupo é exclusivo e aponta para a página de planos.
 */
export const WHATSAPP_GROUP_GATE_MESSAGE =
  'O grupo de membros é exclusivo para assinantes. Compre um plano para entrar.';
