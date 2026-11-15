# Implantação na Railway

## Preparação

1. Crie ou selecione o projeto Railway.
2. Provisione Postgres e Redis.
3. Provisione o LiteLLM usando a imagem fixada em `infra/litellm/railway.json`.
4. Crie um serviço para cada diretório em `services/`.
5. Defina o diretório raiz de cada serviço para seu respectivo diretório.
6. Configure as variáveis listadas no `.env.example` por serviço.

## Ordem recomendada

1. Postgres
2. Redis
3. LiteLLM
4. APIs públicas
5. Portal e painel
6. Checkout
7. Landing
8. Monitor de franquias

## Verificações

- `GET /health/readiness` no LiteLLM deve indicar banco conectado.
- `GET /healthz` nas aplicações HTTP deve responder com sucesso.
- `GET /v1/models` sem chave deve rejeitar a requisição.
- O checkout só está pronto quando `GET /healthz` retorna `checkoutReady: true`.
- Um webhook sem assinatura deve ser rejeitado.
- Execute uma compra em modo de teste antes de habilitar pagamentos reais.

## Cron

`consecom-token-quota-monitor` usa `*/5 * * * *` e deve encerrar com código zero após cada execução.

`consecom-checkout-e2e-temporary` é uma ferramenta de diagnóstico e não deve ficar como serviço HTTP permanente.

