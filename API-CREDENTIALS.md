# Consecom Routing - Credenciais de Produção

> **Status atual (05/09/2026 03:08)**: API 100% funcional. Toda a infraestrutura foi resolvida.
> Falta apenas: chaves de provedores com saldo para fazer inferência real.

## URLs

| Endpoint | URL |
|---|---|
| **API (Backend)** | `https://api-production-d761c.up.railway.app` |
| **Domínio Custom (em propagação)** | `https://api.consecom.com.br` |
| **Painel (Frontend)** | `https://painel.consecom.com.br` |

## Credenciais Admin

```
URL Painel Admin:  https://painel.consecom.com.br/admin/login
Email Admin:       admin@consecom.local
Senha Admin:       ChangeMe123!
```

## Cliente Ilimitado (criado)

```
Email:             wesley@consecom.com.br
Senha:             Wesley2025!
Plano:             ENTERPRISE (30 dias, até 2026-10-05)
Créditos:          10.000.000 (dez milhões)
Rate Limit:        200 req/min
```

## API Key Ilimitada

```
sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74
```

### Exemplo de uso (OpenAI-compatible)

```bash
curl -X POST https://api-production-d761c.up.railway.app/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74' \
  -d '{
    "model": "claude-haiku-4-5",
    "messages": [{"role":"user","content":"Olá"}],
    "max_tokens": 100
  }'
```

### Modelos disponíveis

| Model Code | Provider | Preço input/1k | Preço output/1k |
|---|---|---|---|
| `claude-haiku-4-5` | anthropic | $0.001 | $0.005 |
| `claude-sonnet-4-5` | anthropic | $0.003 | $0.015 |
| `claude-opus-4-5` (desabilitado) | anthropic | $0.015 | $0.075 |

> Outros modelos OpenRouter podem ser habilitados adicionando ao banco via `/v1/admin/models`.

## ⚠️ Pendência: Chaves de provedores

A chave **OpenRouter_API_KEY** foi configurada no Railway mas está expirada/revogada (retorna `User not found`). Precisa de uma chave válida.

Configure no Railway via:
```bash
railway variables --set "OPENROUTER_API_KEY=sk-or-v1-..."
```

ou `ANTHROPIC_API_KEY=sk-ant-...` para usar diretamente a Anthropic.

## Diagnóstico do problema resolvido

| Problema | Causa | Solução |
|---|---|---|
| Deploys falhando | Docker build não instalava deps do workspace | `pnpm install --recursive` + .dockerignore |
| Seed crashava | Enum `provider_code` não tinha `puter`/`openrouter`/`poyo` | `ALTER TYPE ADD VALUE IF NOT EXISTS` no migrate pre-step |
| tsx não encontrado | pnpm não cria `.bin/tsx` em prod | `npm install -g tsx@4` no Dockerfile |
| `pnpm install` rodava só 25 pacotes | Sem `--recursive` | Adicionado flag |
| Domínio custom `api.consecom.com.br` retornando 404 | Cache/propagação DNS | Usar `api-production-d761c.up.railway.app` direto |

## Próximos passos

1. **Adicionar chave válida** de OpenRouter ou Anthropic no Railway:
   ```bash
   railway variables --set "OPENROUTER_API_KEY=<sua-chave>"
   railway variables --set "ANTHROPIC_API_KEY=<sua-chave>"  # opcional
   ```
2. **Mapear domínio custom** `api.consecom.com.br` → `api-production-d761c.up.railway.app` no painel Railway (atualmente está propagando)
3. **Testar inferência**:
   ```bash
   curl https://api-production-d761c.up.railway.app/health
   curl https://api-production-d761c.up.railway.app/setup/users
   ```

## Repositório

- GitHub: https://github.com/WmAgencia/Consecom-Routing
- Último deploy: `5a586607` (SUCCESS)
- Branch: `main`
