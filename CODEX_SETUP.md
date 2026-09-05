# 🚀 Codex CLI + Consecom Routing

Use o **Codex (ChatGPT CLI)** com a API do Consecom Routing — acesso ilimitado ao Claude Code via Puter como provider primário, com fallback automático pra OpenRouter, Poyo e Anthropic.

## ⚡ Setup em 30 segundos

### Opção A — Variáveis de ambiente (recomendado)

```bash
export OPENAI_API_KEY="sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74"
export OPENAI_API_BASE="https://api-production-d761c.up.railway.app/v1"

codex "me ajude a refatorar esse módulo"
```

### Opção B — `~/.codex/config.toml`

```toml
[openai]
api_key = "sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74"
base_url = "https://api-production-d761c.up.railway.app/v1"
```

## 🤖 Modelos disponíveis

| Code (use no codex) | Provider Real | Plano |
|---|---|---|
| `claude-haiku-4-5-puter` | **Puter (Anthropic direto)** | ENTERPRISE |
| `claude-sonnet-4-5-puter` | Puter | ENTERPRISE |
| `claude-opus-4-5-puter` | Puter | ENTERPRISE |
| `claude-opus-4-8-puter` | Puter | ENTERPRISE |
| `claude-sonnet-5-puter` | Puter | ENTERPRISE |
| `claude-opus-5-puter` | Puter | ENTERPRISE |
| `claude-haiku-4-5` | Anthropic (fallback) | ENTERPRISE |
| `claude-sonnet-4-5` | Anthropic (fallback) | ENTERPRISE |
| `claude-3-haiku` | OpenRouter (fallback) | ENTERPRISE |

Padrão recomendado: **`claude-haiku-4-5-puter`** (rápido + barato + funciona agora).

## 💡 Uso

```bash
# Pergunta simples
codex "explique este regex"

# Tarefa específica
codex -m claude-opus-5-puter "revise esse código pra performance"

# Pipe com git diff
git diff | codex -m claude-sonnet-5-puter "gere mensagem de commit"

# Iniciar REPL interativo com modelo customizado
codex --model claude-opus-5-puter
```

## 🔄 Como funciona o roteamento

O Consecom Routing usa **Puter como provider primário** (mais confiável, User-Pays model). Se o Puter falhar, ele cai automaticamente pra:

1. **OpenRouter** (free tier + paid)
2. **Poyo** (precisa crédito)
3. **Anthropic** (precisa `ANTHROPIC_API_KEY` configurada)

Você sempre vê o modelo que pediu no billing (preço Claude), mas por baixo pode ser GPT-5.6-SOL via Poyo — mais barato pra você operar.

## 🧪 Testar compatibilidade

```bash
# Listar modelos (formato OpenAI)
curl -s https://api-production-d761c.up.railway.app/v1/models \
  -H "Authorization: Bearer sk_cr_live_..."

# Chat completion (igual OpenAI)
curl -s -X POST https://api-production-d761c.up.railway.app/v1/chat/completions \
  -H "Authorization: Bearer sk_cr_live_..." \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-haiku-4-5-puter","messages":[{"role":"user","content":"oi"}]}'
```

## 💳 Sua conta

| Item | Valor |
|---|---|
| Plano | ENTERPRISE (30 dias) |
| Créditos | 10.000.000 |
| API Key | `sk_cr_live_b3162a040931f877_abCnio-PNPAQF3p_vS7PgzGHIPlPRkjpTxHmCir3B74` |
| Expira | 2026-10-05 |

Painel: https://painel.consecom.com.br

## ⚠️ Limitações conhecidas

- Streaming retorna em chunk único (não SSE chunked) — Codex aceita normalmente
- Models com ZDR policy no OpenRouter não funcionam (Fable 5)
- Poyo sem crédito retorna erro 502 → fallback automático resolve
