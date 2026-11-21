# Implantação na Railway

## Preparação

1. Crie ou selecione o projeto Railway.
2. Provisione Postgres e Redis.
3. Provisione o LiteLLM usando a imagem fixada em `infra/litellm/railway.json`.
4. Crie um serviço para cada diretório em `services/`.
5. Defina o diretório raiz de cada serviço para seu respectivo diretório.
6. Configure as variáveis listadas no `.env.example` por serviço.

## Migrações

O schema é versionado em `migrations/` e aplicado por um comando único, idempotente e registrado em `consecom_schema_migrations`:

```bash
DATABASE_URL="postgres://..." npm run migrate
```

Regras:

- Execute antes de criar ou atualizar qualquer serviço de aplicação.
- Cada arquivo contém uma única instrução e é aplicado uma vez; não edite um arquivo já aplicado — crie o próximo número.
- `consecom_usage_accounted` **não** é criada pelo repositório. A última migração falha de propósito se a relação não existir, porque uma tabela vazia desativaria o bloqueio de franquias em silêncio. Restaure a definição de produção com `pg_dump --schema-only -t consecom_usage_accounted` antes de migrar.
- Os `CREATE TABLE IF NOT EXISTS` mantidos no boot dos serviços continuam válidos, mas a fonte de verdade é `migrations/`.

## Ordem recomendada

1. Postgres
2. Migrações (`npm run migrate`)
3. Redis
4. LiteLLM
5. APIs públicas
6. Portal e painel
7. Checkout
8. Landing
9. Monitor de franquias

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

