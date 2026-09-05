# Consecom Routing - Credenciais de Produção

## Status: ✅ TUDO FUNCIONANDO (05/09/2026 às 10:18 UTC)

Inferência real via OpenRouter confirmada:
```json
{
  "model": "claude-3-haiku",
  "choices": [{"message": {"content": "OK, eu entendi. Obrigado por me dizer que estou funcionando cor..."}}]
}
```

## URLs

| Endpoint | URL |
|---|---|
| **API (Backend)** | `https://api-production-d761c.up.railway.app` |
| **Painel (Frontend)** | `https://painel.consecom.com.br` |

## Admin Master

```
URL:       https://painel.consecom.com.br/admin/login
Email:     admin@consecom.local
Senha:     ChangeMe123!
```

## Cliente Ilimitado

```
Email:     wesley@consecom.com.br
Senha:     Wesley2025!
Plano:     ENTERPRISE (30 dias, até 2026-10-05)
Créditos:  10.000.000
Rate:      200 req/min
```

## API Key Ilimitada ✅ FUNCIONANDO

```
sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74
```

### Exemplo de uso

```bash
curl -X POST https://api-production-d761c.up.railway.app/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74' \
  -d '{
    "model": "claude-3-haiku",
    "messages": [{"role":"user","content":"Olá"}],
    "max_tokens": 100
  }'
```

## Modelos disponíveis

| Model Code | Provider Real | Preço | OpenRouter ID |
|---|---|---|---|
| `claude-3-haiku` | OpenRouter | $0.0002 / $0.001 | `anthropic/claude-3-haiku` |
| `claude-haiku-4-5` | Anthropic | $0.001 / $0.005 | (precisa chave Anthropic) |
| `claude-sonnet-4-5` | Anthropic | $0.003 / $0.015 | (precisa chave Anthropic) |

Para adicionar mais modelos OpenRouter (Sonnet, Opus, etc):
```bash
curl -X POST https://api-production-d761c.up.railway.app/setup/create-model \
  -H 'Content-Type: application/json' \
  -d '{"code":"claude-sonnet-4-5-openrouter","displayName":"Claude Sonnet 4.5","providerCode":"openrouter","inputPricePer1kCents":300,"outputPricePer1kCents":1500}'
```

## Provedores configurados

- ✅ **OpenRouter** com chave `redacted` (sua chave nova) — funcionando
- ❌ Anthropic (precisa chave em `ANTHROPIC_API_KEY`)
- ❌ Puter (precisa chave em `PUTER_AUTH_TOKEN`)
- ❌ Poyo (precisa chave em `POYO_API_KEY`)

## Rotas de debug úteis

- `GET /setup` — Mostra quantos users/api keys existem
- `GET /setup/users` — Lista users
- `POST /setup/fix-enums` — Adiciona valores faltantes no enum `provider_code`
- `POST /setup/create-model` — Cria novo modelo (body: code, displayName, providerCode, prices)
- `POST /setup/rotate-keys` — Re-criptografa todas as chaves dos providers dos env vars
- `GET /setup/debug-key` — Verifica se a chave descriptografada bate com a env var

## Problemas resolvidos

1. ✅ Dockerfile não instalava deps — `pnpm install --recursive`
2. ✅ tsx não encontrado — `npm install -g tsx@4`
3. ✅ Enum sem `puter`/`openrouter`/`poyo` — `ALTER TYPE ADD VALUE IF NOT EXISTS`
4. ✅ Seed falhando — try/catch em todos os providers
5. ✅ Deploys crashando — paths no PATH global
6. ✅ Domínio custom não funcionando — usar `api-production-d761c.up.railway.app`
7. ✅ Chave OpenRouter errada no banco — endpoint `/setup/rotate-keys`

## Repositório

- GitHub: https://github.com/WmAgencia/Consecom-Routing
- Último deploy: `7b341324` (SUCCESS)
- Branch: `main`
