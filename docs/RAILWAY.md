# Estado da Railway

Snapshot do projeto `consecom-ai-proxy`, ambiente `production`, em 15 de novembro de 2026.

Nenhum valor secreto foi exportado. Os identificadores abaixo ajudam a comparar o repositório com a infraestrutura existente.

| Serviço | ID Railway | Fonte atual | Domínio | Cron |
| --- | --- | --- | --- | --- |
| consecom-checkout | `5649931d-bf20-4de7-8bfb-7e7ed66a2397` | ghcr.io/railwayapp/function-bun:1.4.4 | `consecom-checkout-production.up.railway.app` | — |
| consecom-checkout-e2e-temporary | `21c37810-cf06-4982-a74c-9c48c8592aa2` | ghcr.io/railwayapp/function-bun:1.4.4 | Privado/sem domínio | — |
| consecom-landing-v3 | `355ce0a7-08f1-420f-82a3-7a09b66069bc` | ghcr.io/railwayapp/function-bun:1.4.4 | `consecom-landing-v3-production.up.railway.app` | — |
| consecom-ai-portal | `8f36e015-5019-4c05-94b3-130cb5777c39` | ghcr.io/railwayapp/function-bun:1.4.4 | `consecom-ai-portal-production.up.railway.app` | — |
| consecom-branded-api | `9446e067-5131-4abf-80e3-639b95ca7c6a` | ghcr.io/railwayapp/function-bun:1.4.4 | `api-consecom.up.railway.app` | — |
| consecom-smart-api | `c3ed8510-8ce1-47d9-9666-f910084359f2` | ghcr.io/railwayapp/function-bun:1.4.4 | `litellm-production-90c2f4f8.up.railway.app` | — |
| consecom-token-quota-monitor | `7f6e10ad-2dcf-44b6-9461-459245785740` | ghcr.io/railwayapp/function-bun:1.4.4 | Privado/sem domínio | */5 * * * * |
| consecom-proxy-dashboard | `a597c9ed-607f-4721-a7b1-a3c2000978b1` | ghcr.io/railwayapp/function-bun:1.4.4 | `consecom-proxy-dashboard-production.up.railway.app` | — |
| Redis | `abfd4312-f5a9-49e3-9400-6386dd5c5d06` | redis:8.2@sha256:7d1e4ce8b9395088377ab382d1f6cfdbd13b3690795198a0399ab8d683064d6d | Privado/sem domínio | — |
| Postgres | `2a075cd6-5ed0-4aa2-aa5c-2107e3261de3` | ghcr.io/railwayapp-templates/postgres-ssl:18@sha256:469c779c7c57ec6bad4670a0a3cb5a830aa6e0ce4f3707137608de5223a5041c | Privado/sem domínio | — |
| LiteLLM | `0f11282c-0908-41bd-bfb8-455bf3680eea` | ghcr.io/berriai/litellm:v1.106.6@sha256:37e2dafb088a7723beb998590682957386dfc83ffea1848486f8e0e5cfac0b06 | `consecom-litellm-admin.up.railway.app` | — |

## Variáveis por serviço

- **consecom-checkout:** `DATABASE_URL`, `LITELLM_MASTER_KEY`, `LITELLM_URL`, `PORT`, `SESSION_SECRET`, `STRIPE_WEBHOOK_SECRET`
- **consecom-checkout-e2e-temporary:** `DATABASE_URL`, `PORTAL_URL`
- **consecom-landing-v3:** nenhuma variável própria
- **consecom-ai-portal:** `DATABASE_URL`, `LITELLM_MASTER_KEY`, `LITELLM_URL`, `PORT`, `PUBLIC_API_URL`, `SESSION_SECRET`, `STRIPE_WEBHOOK_SECRET`
- **consecom-branded-api:** `LITELLM_MASTER_KEY`, `LITELLM_URL`, `PORT`
- **consecom-smart-api:** `LITELLM_MASTER_KEY`, `LITELLM_URL`, `PORT`
- **consecom-token-quota-monitor:** `DATABASE_URL`, `LITELLM_MASTER_KEY`, `LITELLM_URL`
- **consecom-proxy-dashboard:** `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PASSWORD_HASH`, `ADMIN_USERNAME`, `DATABASE_URL`, `LITELLM_MASTER_KEY`, `LITELLM_URL`, `PORT`, `PUBLIC_API_URL`, `PUBLIC_ORIGIN`, `SESSION_SECRET`
- **Redis:** `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`, `REDISHOST`, `REDISPORT`, `REDISUSER`, `REDIS_PASSWORD`, `REDIS_URL`
- **Postgres:** `DATABASE_URL`, `PGDATA`, `PGDATABASE`, `PGHOST`, `PGPASSWORD`, `PGPORT`, `PGUSER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, `POSTGRES_USER`, `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`, `SSL_CERT_DAYS`
- **LiteLLM:** `DATABASE_URL`, `DEEPSEEK_API_KEY`, `ENFORCE_PRISMA_MIGRATION_CHECK`, `HOST`, `LITELLM_LOCAL_MODEL_COST_MAP`, `LITELLM_MASTER_KEY`, `LITELLM_SALT_KEY`, `OR_SITE_URL`, `PORT`, `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`, `REDIS_URL`, `STORE_MODEL_IN_DB`, `UI_USERNAME`

## Volumes

- `postgres-volume`: 5 GB, montado no Postgres em `/var/lib/postgresql/data`.
- `redis-volume`: 5 GB, montado no Redis em `/data`.

## Observações

- Ambiente: `a602d36e-516e-4270-827b-298ab7ce7bdb`.
- Projeto: `1e8fccd4-3280-4332-8293-c6c51490b1ed`.
- Região atual: `iad`.
- Os serviços Bun foram exportados da versão efetivamente implantada.
- O código do repositório não inclui valores de variáveis da Railway.

