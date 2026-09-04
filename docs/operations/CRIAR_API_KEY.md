# Criando uma API Key — Runbook

> Guia canônico para emitir uma nova API Key do Consecom Routing.
> Última revisão: 2026-09-03

---

## 1. Visão geral

Uma API Key dá acesso ao endpoint `POST /v1/chat/completions` da API. Ela é validada em 3 camadas:

```
Authorization: Bearer sk_cr_live_<16hex>_<43 base64url chars>
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │ 1. findByPrefix() — lookup O(1)      │
        │    SELECT ... WHERE key_prefix = ?   │
        │    AND status = 'active'             │
        └──────────────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │ 2. argon2.verify() — confere o hash  │
        │    (constant-time compare)           │
        └──────────────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │ 3. Subscription + credits + modelo   │
        │    (valida plano ativo, saldo > 0,   │
        │     modelo permitido no plano)       │
        └──────────────────────────────────────┘
```

### Formato canônico da chave

```
sk_cr_live_<16 hex chars>_<32 bytes em base64url>
└─────┬────┘ └────┬────┘ └────────┬────────┘
   prefixo       prefixo       segredo (mostrado
  fixo           de lookup     só uma vez)
```

- **Prefixo público**: `sk_cr_live_` (constante, em `ApiKeyService`).
- **Prefixo de lookup**: 16 chars hex (gerado via `randomBytes(8).toString('hex')`).
- **Segredo**: 32 bytes em base64url — 43 chars.
- **Hash**: argon2id do secret completo, guardado em `api_keys.key_hash`.

### Onde a chave mora

| Tabela | Coluna | Conteúdo |
|---|---|---|
| `api_keys` | `key_hash` | argon2 hash da chave completa |
| `api_keys` | `key_prefix` | `sk_cr_live_<16hex>` (lookup) |
| `api_keys` | `status` | `active` / `revoked` / `expired` |
| `api_keys` | `expires_at` | `null` (sem expiração) ou data |

---

## 2. Pré-requisitos

Antes de criar uma chave, garanta:

- [ ] `DATABASE_URL` configurado em `.env.local`
- [ ] `MASTER_ENCRYPTION_KEY` configurado (hex ≥ 16 bytes) — usado para criptografar `provider_secrets`
- [ ] `ANTHROPIC_API_KEY` configurado — chave de upstream que sua API repassa
- [ ] Plano seedado (`pnpm run seed`) — sem isso, `plans` está vazio
- [ ] Migrations aplicadas (`pnpm run migrate`) — cria `users`, `customers`, `subscriptions`, `api_keys`, `provider_secrets`, etc.

Para validar tudo de uma vez:

```bash
cd packages/db
pnpm run seed
```

Se o seed reclamar de UNIQUE violation em `users.email`, é porque o user já existe — é esperado e idempotente.

---

## 3. Caminhos para criar uma chave

Do **mais rápido** ao **mais trabalhoso**. Use o primeiro que resolver.

---

### 3.1. Caminho A — Pelo dashboard (recomendado)

**Tempo:** ~30 segundos. **Quando usar:** ambiente de produção, clientes reais.

O seu front já tem a rota `POST /v1/api-keys` plugada (`apps/web/src/app/dashboard/api-keys/page.tsx`). O fluxo é:

1. Cliente faz login no dashboard.
2. Vai em **Configurações → API Keys**.
3. Clica **"Gerar nova chave"**.
4. Escolhe um **nome** (ex: `Production Server`) e um **prazo** em dias (ou vazio = sem expiração).
5. Clica **Confirmar**.
6. A chave aparece **uma única vez** na modal. Clicou em copiar? Salve em algum cofre (1Password, Bitwarden, Vault).

A request subjacente é:

```http
POST /v1/api-keys
Cookie: __consecom_session=<session JWT>
Content-Type: application/json

{
  "name": "Production Server",
  "expiresInDays": 30
}
```

Resposta (200):

```json
{
  "id": "uuid",
  "name": "Production Server",
  "keyPrefix": "sk_cr_live_a6654bb3db944988",
  "status": "active",
  "createdAt": "2026-09-03T00:00:00.000Z",
  "expiresAt": "2026-10-03T00:00:00.000Z",
  "lastUsedAt": null,
  "requestCount": 0,
  "key": "sk_cr_live_a6654bb3db944988_n5gsqluIeMNGKOKys5wX8Xw6CTTwdG7az7vli_LAAks"
}
```

> ⚠️ O campo `key` (chave completa) **só é retornado na criação**. Nem o admin consegue recuperar depois — só o `key_prefix` para listagem.

---

### 3.2. Caminho B — Via API direta (curl)

**Tempo:** ~2 minutos. **Quando usar:** automação, CI/CD, testes.

Requer uma sessão autenticada de **admin** ou **superadmin** (porque o cookie session precisa ter `role != 'customer'` ou você precisa chamar o endpoint admin em `routes/admin/api.ts`).

```bash
# 1. Logar e obter cookie de sessão
curl -sS -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "seu-admin@dominio.com",
    "password": "sua-senha"
  }'

# 2. Criar a chave
curl -sS -X POST http://localhost:3000/v1/api-keys \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "CI/CD Key",
    "expiresInDays": 90
  }'
```

Resposta inclui o `key` completo. Copie imediatamente.

---

### 3.3. Caminho C — Script de bootstrap (idempotente, faz tudo)

**Tempo:** ~1 minuto. **Quando usar:** setup inicial, recuperação após perda total, "ilimitado" para testes.

Cria **tudo de uma vez**: user → customer → subscription (30 dias, plano POWER) → saldo inflado → provider_secret criptografado → api_key.

```bash
cd packages/db
pnpm run bootstrap:key seu-email@dominio.com
```

Saída esperada:

```
[1/6] Running drizzle migrations ...
[2/6] Ensuring user exists: seu-email@dominio.com
    user.id = c2f561e1-...
[3/6] Ensuring customer record ...
[4/6] Activating 30-day POWER subscription ...
    subscription.id = 225bf879-..., expires in 30 days
[5/6] Inflating credit balance ...
[6/6] Encrypting ANTHROPIC_API_KEY → provider_secrets ...
[7/7] Minting api_key ...
    new key prefix: sk_cr_live_a6654bb3db944988

==========================================================
  BOOTSTRAP COMPLETE
==========================================================
  API KEY (copy now — full secret only visible here):
  sk_cr_live_a6654bb3db944988_n5gsqluIeMNGKOKys5wX8Xw6CTTwdG7az7vli_LAAks
==========================================================
```

A chave também é salva em `.bootstrap-key.txt` no cwd.

**O script é idempotente**: rodar de novo renova a subscription, mantém os créditos inflados e **só cria api_key nova se não houver ativa** (reutiliza a existente caso já tenha).

> Para "ilimitado verdadeiro" (sem rate limit), edite o `INSERT INTO api_keys` no script e troque `NULL` por `999999` em `rate_limit_override`.

---

### 3.4. Caminho D — Direto no banco (último recurso)

**Tempo:** ~5 minutos. **Quando usar:** o app está fora do ar e você precisa emitir uma chave de emergência.

```bash
cd packages/db
./node_modules/.bin/tsx  # ou: pnpm exec tsx
```

Cole este script inline (ajuste o email):

```typescript
import postgres from 'postgres';
import { randomBytes } from 'node:crypto';
import { hash as argonHash } from '@node-rs/argon2';

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
const EMAIL = 'seu-email@dominio.com';

const [user] = await sql`
  SELECT id FROM users WHERE email = ${EMAIL}
`;
if (!user) { console.error('User not found'); process.exit(1); }

const prefix = randomBytes(8).toString('hex');
const secret = randomBytes(32).toString('base64url');
const fullKey = `sk_cr_live_${prefix}_${secret}`;
const keyHash = await argonHash(fullKey);
const keyPrefix = `sk_cr_live_${prefix}`;

await sql`
  INSERT INTO api_keys
    (customer_id, name, key_hash, key_prefix, status, expires_at)
  VALUES
    (${user.id}, 'emergency-key', ${keyHash}, ${keyPrefix}, 'active', NOW() + INTERVAL '30 days')
`;

console.log('API KEY:', fullKey);
await sql.end();
```

> ⚠️ Esse caminho **não encripta nem provisiona provider_secrets**. A chave só serve se a API já estiver configurada para usar env vars (fallback do `ProviderRegistry.getApiKey()`).

---

## 4. Validando que a chave funciona

```bash
curl -sS -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer sk_cr_live_<...>_..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "messages": [{"role": "user", "content": "ping"}],
    "max_tokens": 10
  }'
```

Resposta esperada (200):

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "Pong!" },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1,
    "completion_tokens": 1,
    "total_tokens": 2
  }
}
```

Se receber algo diferente, veja o troubleshooting abaixo.

---

## 5. Troubleshooting

### 5.1. `401 invalid api key`

Causa provável: chave mal copiada, com espaço, quebra de linha, ou caractere a mais/menos.

```bash
# Verifique se a chave tem exatamente o formato:
echo "$KEY" | grep -E "^sk_cr_live_[0-9a-f]{16}_[A-Za-z0-9_-]{43}$"
# Espera: imprime a chave inteira. Se vazio: chave corrompida.
```

### 5.2. `401 api key has expired`

A chave tem `expires_at` no passado. Crie outra (qualquer um dos 4 caminhos).

### 5.3. `403 customer is not active`

O `customers.status` está `suspended` ou `banned`. Verifique:

```sql
SELECT c.status, c.notes FROM customers c
JOIN users u ON u.id = c.id WHERE u.email = 'seu@email.com';
```

Para reativar:

```sql
UPDATE customers SET status = 'active', updated_at = NOW()
WHERE id = (SELECT id FROM users WHERE email = 'seu@email.com');
```

### 5.4. `403 model ... is not available on your plan`

O modelo não está em `plan.modelsAllowed`. Veja o array:

```sql
SELECT models_allowed FROM plans WHERE code = 'POWER';
```

Se for um modelo legítimo que deveria estar, adicione via migration + seed, ou force via:

```sql
UPDATE plans SET models_allowed = models_allowed || '["claude-3-5-sonnet-20241022"]'::jsonb
WHERE code = 'POWER';
```

### 5.5. `402 insufficient credits for worst-case estimate`

Saldo zerou ou está reservado. Verifique:

```sql
SELECT credits_available, credits_reserved, credits_used
FROM credit_balances WHERE customer_id = (
  SELECT id FROM users WHERE email = 'seu@email.com'
);
```

Para inflar (uso em dev):

```sql
UPDATE credit_balances SET credits_available = 1000000, updated_at = NOW()
WHERE customer_id = (SELECT id FROM users WHERE email = 'seu@email.com');
```

### 5.6. `429 rate limit exceeded`

Você excedeu `rate_limit_per_min`. Veja o header `Retry-After` para saber quanto esperar. Para subir o limite pontualmente:

```sql
UPDATE api_keys SET rate_limit_override = 999999
WHERE key_prefix = 'sk_cr_live_<16hex>';
```

### 5.7. `502 provider anthropic is currently disabled`

`providers.status` está `disabled` ou `error`. Veja:

```sql
SELECT code, status FROM providers;
```

E os logs do `provider_secrets`:

```sql
SELECT p.code, ps.rotated_at
FROM providers p LEFT JOIN provider_secrets ps ON ps.provider_id = p.id;
```

Re-encripte e re-grave a chave se necessário:

```bash
pnpm run bootstrap:key seu-email@dominio.com   # passo 6 re-encripte automaticamente
```

---

## 6. Revogando uma chave

Quando a chave vazar ou não for mais usada, revogue (não delete — o histórico de `usage_events` precisa do `api_key_id` para auditoria):

```sql
UPDATE api_keys
SET status = 'revoked', revoked_at = NOW()
WHERE key_prefix = 'sk_cr_live_<16hex>'
  AND customer_id = (SELECT id FROM users WHERE email = 'seu@email.com');
```

Ou via API:

```bash
curl -X DELETE http://localhost:3000/v1/api-keys/<key-id> \
  -b cookies.txt
```

A chave revogada continua aparecendo em listagens (`status = 'revoked'`) mas o `findByPrefix()` rejeita.

> O índice parcial `api_keys_prefix_active_idx` garante que `key_prefix` + `status='active'` é único — então você pode revogar e criar uma nova com o mesmo prefixo sem conflito.

---

## 7. Lição aprendida — chave local ≠ chave de produção

> ⚠️ **Bug clássico de 2026-09-03**: o bootstrap foi rodado localmente com o `DATABASE_URL` do `.env.local` apontando para o Supabase de testes (`iuvzpvhaxlrbwaitizci`). O servidor `api.nexxus-pro.site` lê do banco **de produção** (outro `DATABASE_URL`). Resultado: a chave existia mas o servidor retornava `invalid api key`.

**Regra:** sempre rode o bootstrap **no ambiente onde a chave será usada**.

| Ambiente | Comando | Banco alvo |
|---|---|---|
| Local (dev) | `pnpm run bootstrap:key` no seu terminal | Supabase dev |
| Preview/staging | `pnpm run bootstrap:key` dentro do shell do Railway staging | Supabase staging |
| **Produção** | **`pnpm run bootstrap:key` dentro do Railway Shell do serviço `api`** | **Supabase prod** |

Para abrir o shell de produção:

1. Acesse [railway.app](https://railway.app) → projeto → serviço `@consecom/api`
2. Aba **Variables** confirma que `DATABASE_URL`, `MASTER_ENCRYPTION_KEY` e `ANTHROPIC_API_KEY` estão setadas
3. Aba **Shell** (ou `railway run --service @consecom/api bash` se usar CLI)
4. Rode:

```bash
cd packages/db
pnpm run bootstrap:key seu-email@dominio.com
```

As variáveis já estão no ambiente, então o script pega tudo certo. A chave impressa será a que o `api.nexxus-pro.site` aceita.

---

## 8. Resumo rápido

| Quero... | Comando |
|---|---|
| Criar chave pelo dashboard | Abrir `/dashboard/api-keys` |
| Criar chave via API | `POST /v1/api-keys` com cookie de sessão |
| Criar chave + tudo provisionado | `pnpm run bootstrap:key <email>` |
| Testar chave | `curl POST /v1/chat/completions -H "Authorization: Bearer ..."` |
| Listar minhas chaves | `GET /v1/api-keys` |
| Revogar chave | `DELETE /v1/api-keys/<id>` ou `UPDATE ... status='revoked'` |
| Inflar créditos | `UPDATE credit_balances SET credits_available = 1000000 ...` |
| Subir rate limit | `UPDATE api_keys SET rate_limit_override = 999999 ...` |
| Re-encripter Anthropic key | Rodar `bootstrap:key` de novo (passo 6 atualiza) |
