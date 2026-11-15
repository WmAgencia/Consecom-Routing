# Catálogo de serviços

## Aplicações HTTP

### consecom-landing-v3

Site público. Expõe `/` e `/healthz`; caminhos de login e área do cliente são redirecionados ao portal.

### consecom-ai-portal

Autenticação, painel administrativo e área do cliente. Usa Postgres e as APIs administrativas do LiteLLM.

### consecom-checkout

Cadastro comercial, criação de pagamento, webhook assinado, acompanhamento do pedido e revelação única da chave.

### consecom-branded-api

URL pública recomendada. Mantém os nomes públicos de modelos e compatibilidade esperada pelo Claude Code.

### consecom-smart-api

Endpoint de compatibilidade mantido para configurações existentes. Novas integrações devem usar a URL pública recomendada.

### consecom-proxy-dashboard

Painel técnico para provedores, usuários internos, chaves, limites e visão operacional.

## Processos

### consecom-token-quota-monitor

Executado a cada cinco minutos. Soma tokens contabilizados, bloqueia chaves esgotadas e libera somente chaves anteriormente bloqueadas pelo próprio monitor.

### consecom-checkout-e2e-temporary

Diagnóstico executável do checkout. Valida página, saúde, configuração, proteção de origem e assinatura do webhook sem efetuar cobrança.

## Infraestrutura

### LiteLLM

Camada interna de autenticação, contabilidade e roteamento. O catálogo fica em variável selada.

### Postgres

Fonte persistente de usuários, pedidos, sessões, chaves, métricas e configuração.

### Redis

Cache privado e descartável. A configuração atual não persiste dados após reinício.

