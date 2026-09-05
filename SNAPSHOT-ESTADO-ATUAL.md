# SNAPSHOT ESTADO ATUAL - 05/09/2026 14:42 UTC

> ⚠️ **PONTO DE RECUPERAÇÃO** — Não mexer em nada sem restaurar este estado primeiro

## URLs em Produção

| Endpoint | URL | Status |
|---|---|---|
| API Railway (oficial) | `https://api-production-d761c.up.railway.app` | ✅ Funcionando |
| Domínio custom | `https://api.consecom.com.br` | ⚠️ Aponta para lugar errado |
| Painel | `https://painel.consecom.com.br` | ✅ Online |

## Health checks confirmados

```bash
curl https://api-production-d761c.up.railway.app/health
# → {"status":"ok","service":"consecom-api","timestamp":"..."}

curl https://api-production-d761c.up.railway.app/setup
# → {"users":1,"apiKeys":0,"initialized":true}
```

## Credenciais Admin

```
URL Login:  https://api-production-d761c.up.railway.app/v1/admin/login
Email:      admin@consecom.local
Senha:      ChangeMe123!
```

## Cliente Ilimitado (wesley@consecom.com.br)

```
Email:      wesley@consecom.com.br
Senha:      Wesley2025!
Plano:      ENTERPRISE (30 dias)
Expira em:  2026-10-05
Créditos:   10.000.000
Rate:       200 req/min
```

## API Key Ilimitada

```
sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74
```

## Variáveis de Ambiente (Railway)

```bash
DATABASE_URL=postgresql://postgres:gsEt***@postgres.railway.internal:5432/railway
JWT_SECRET=8dfde56322b7b2ebeea1bca19e875f66989575b6c1be291d5
MASTER_ENCRYPTION_KEY=97517d6702c64c55e0ded1aa073ea5ca606e0360b228fe175
OPENROUTER_API_KEY=sk-or-v1-2fc7479b****d592 (criptografada no banco via setup/rotate-keys)
POYO_API_KEY=sk-oswwpQ0D****tovA (criptografada no banco via setup/rotate-keys)
PUTER_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...CHzg (criptografada no banco via setup/rotate-keys)
```

## Provedores Conectados

| Provedor | Status | Chave |
|---|---|---|
| anthropic | ⚠️ Sem chave | (vazio) |
| openrouter | ✅ Ativo, free tier | sk-or-v1-...d592 |
| puter | ✅ Ativo, crédito | eyJ...CHzg |
| poyo | ✅ Chave ok, sem crédito | sk-oswwpQ0...tovA |

## Modelos cadastrados (17 modelos)

| Code | Provider | Input $/1k | Output $/1k |
|---|---|---|---|
| claude-3-haiku | openrouter | 10 | 50 |
| claude-haiku-4-5 | anthropic | 100 | 500 |
| claude-sonnet-4-5 | anthropic | 300 | 1500 |
| claude-opus-4-5 | anthropic (disabled) | 1500 | 7500 |
| claude-haiku-4-5-puter | puter | 100 | 500 |
| claude-sonnet-4-5-puter | puter | 300 | 1500 |
| claude-opus-4-5-puter | puter | 1500 | 7500 |
| claude-opus-4-8-puter | puter | 500 | 2500 |
| claude-sonnet-5-puter | puter | 300 | 1500 |
| claude-opus-5-puter | puter | 500 | 2500 |
| claude-opus-5 | poyo | 500 | 2500 |
| claude-sonnet-5 | poyo | 300 | 1500 |
| claude-fable-5 | poyo | 1000 | 5000 |
| gpt-5-6-sol | poyo | 56 | 280 |
| claude-opus-5-or | openrouter | 500 | 2500 |
| claude-sonnet-5-or | openrouter | 300 | 1500 |
| claude-fable-5-or | openrouter | 1000 | 5000 |
| gpt-5-6-sol-or | openrouter | 56 | 280 |

## Plano ENTERPRISE - ModelsAllowed (depois do último update)

```json
["claude-sonnet-4-5","claude-haiku-4-5","claude-3-haiku","claude-haiku-4-5-puter",
 "claude-sonnet-4-5-puter","claude-opus-4-5-puter","claude-opus-4-8-puter",
 "claude-sonnet-5-puter","claude-opus-5-puter","claude-opus-5","claude-sonnet-5",
 "claude-fable-5","gpt-5-6-sol","claude-opus-5-or","claude-sonnet-5-or",
 "claude-fable-5-or","gpt-5-6-sol-or"]
```

## Ordem de Fallback (Puter primary)

```typescript
function getProviderFallbackOrder(modelCode, primaryProvider) {
  const priorityOrder = ['puter', 'openrouter', 'poyo', 'anthropic'];
  const order = [primaryProvider];
  for (const p of priorityOrder) {
    if (p !== primaryProvider) order.push(p);
  }
  return order;
}
```

## Último deploy em produção

- **Commit**: `bef0b94` feat(chat): log which provider successfully answered
- **Deployment ID**: `283f6f16-d0c1-4e25-a731-6adfa4f31760`
- **Status**: SUCCESS
- **PID**: 85
- **Hostname**: bf746cdfb072

## Último teste confirmado funcionando (6 modelos Puter)

| Modelo | Provider | Latência | Resposta |
|---|---|---|---|
| claude-3-haiku | openrouter (fallback) | 2349ms | "OK" |
| claude-haiku-4-5-puter | puter | 1674ms | "OK" |
| claude-sonnet-4-5-puter | puter | 1801ms | "OK" |
| claude-opus-4-5-puter | puter | 1719ms | "OK" |
| claude-opus-4-8-puter | puter | 1672ms | "OK" |
| claude-sonnet-5-puter | puter | 2145ms | "OK" |
| claude-opus-5-puter | puter | 2111ms | "OK" |

## Endpoints Admin disponíveis

- `POST /v1/admin/login` — Login admin
- `POST /v1/admin/customers` — Criar cliente
- `POST /v1/admin/customers/:id/activate-plan` — Ativar plano
- `POST /v1/admin/customers/:id/credits` — Ajustar créditos
- `POST /v1/admin/plans/:id` — Atualizar plano (incl. modelsAllowed)
- `POST /v1/admin/customers/:id/api-keys` — Criar API key

## Endpoints de debug (setup)

- `GET /setup` — Status geral
- `GET /setup/users` — Lista users
- `POST /setup/create-provider` — Criar/atualizar provider
- `POST /setup/create-model` — Criar/atualizar model
- `POST /setup/fix-enums` — Garantir enums do provider_code
- `POST /setup/rotate-keys` — Re-criptografar chaves dos env vars
- `GET /setup/debug-key` — Verificar chave descriptografada
