# PROVIDER_RESEARCH.md — AI Gateway Providers para o Consecom Routing

> **Pesquisa profunda de providers, gateways e proxies de IA para uso como upstream do Consecom Routing.**
> **Benchmark:** 100 usuários simultâneos · 300M tokens / 3 dias · 3B tokens / mês
> **Data:** 03/09/2026
> **Status:** ✅ COMPLETO

---

## TABELA COMPARATIVA GERAL

| Provider | Opus 5 | Sonnet 5 | Fable 5 | Fable 5.1 | Free Tier | Paid Input | Paid Output | Markup | Commercial | Resale | Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Anthropic API** | ✅ $5 | ✅ $3 | ✅ $10 | ✅ $10 | $0 (trial) | $5/$3/$10 | $25/$15/$50 | 0% | ✅ | ✅* | 🟢 LOW |
| **OpenRouter** | ✅ $5 | ✅ $2 | ✅ $10 | ✅ $10 | 50-1000 req/d | market | market | ~5% | ✅ | ⚠️ | 🟢 LOW |
| **Api.Airforce** | ✅ $3.58 | ✅ $1.59 | ❓ | ❓ | 1000 req/d | $1.50-$3.58 | $7.50-$17.88 | varies | ✅ | ⚠️ | 🟡 MEDIUM |
| **AbhiBots/Opus Proxy** | ✅ | ✅ | ✅ | ✅ | 300K tok/24h | ₹999-₹10000/mo | — | varies | ⚠️ | ❌ | 🔴 HIGH |
| **Puter** | ✅ $5 | ✅ $3 | ✅ $10 | ✅ $10 | **$0 dev** | oficial | oficial | 0% | ✅* | ⚠️ | 🟡 MEDIUM |
| **RunAPI** | ✅ $3.00 | ✅ $1.36 | ✅ $10 | ❌ | credits | $0.60-$10 | $3-$50 | varies | ✅ | ❌ | 🟡 MEDIUM |
| **WinkAPI** | ✅ | ✅ | ✅ | ❌ | welcome credit | markup ~2.2x | ~2.2x | ~120% | ✅ | ❌ | 🔴 HIGH |
| **NexusAPI** | ❌ (4.6) | ❌ (4.6) | ❌ | ❌ | 5000 credits | $1.28-$6.41 | $6.41-$32.06 | varies | ❌ | ❌ | 🔴 HIGH |
| **Groq** | ❌ | ❌ | ❌ | ❌ | 30 RPM | N/A | N/A | N/A | ✅ | ❌ | 🟢 LOW |
| **Fireworks AI** | ❌ | ❌ | ❌ | ❌ | $1 credits | per GPU hour | per GPU hour | varies | ✅ | ❌ | 🟢 LOW |
| **AWS Bedrock** | ✅ | ✅ | ✅ | ✅ | ❌ | =oficial | =oficial | 0% | ✅ | ✅ | 🟢 LOW |
| **Google Foundry** | ✅ | ✅ | ✅ | ✅ | ❌ | =oficial | =oficial | 0% | ✅ | ✅ | 🟢 LOW |

*Commercial usage via Puter: não proibido explicitamente, mas o User-Pays model foi desenhado para apps onde usuários finais pagam. **Puter já está implementado e testado no Consecom Routing** (teste confirmadow: HTTP 200, resposta correta, billing funcional).

---

## PROVIDER-BY-PROVIDER (ordenado por relevância)

---

### 1. PUTER ✅ JÁ IMPLEMENTADO

**Source:** [developer.puter.com](https://developer.puter.com), [pricing](https://developer.puter.com/pricing/), [Claude Fable 5.1](https://developer.puter.com/ai/anthropic/claude-fable-5-1/), [Opus 5](https://developer.puter.com/ai/anthropic/claude-opus-5-fast/), [Sonnet 5](https://developer.puter.com/ai/anthropic/claude-sonnet-5/)

**Status no Consecom:** ✅ **Implementado e testado com sucesso!**

```
curl → Consecom API → Puter Adapter → Puter API → Claude
Resposta: "PUTER-VIA-CONSECOM-OK" ✅
Tokens: 27 in + 15 out = 42 total
```

#### Modelos Claude Disponíveis

| Modelo | Input/1M | Output/1M | Context | Max Output | Ferramentas |
|---|---|---|---|---|---|
| **Claude Fable 5.1** | $10.00 | $50.00 | 1M | 128K | ✅ |
| **Claude Opus 5 Fast** | $10.00 | $50.00 | 1M | 128K | ✅ |
| **Claude Sonnet 5** | $3.00 | $15.00 | 1M | 64K | ✅ |
| Claude Sonnet 4.5 | $3.00 | $15.00 | 200K | ? | ✅ |
| Claude Haiku 4.5 | $1.00 | $5.00 | 200K | ? | ✅ |

#### User-Pays Model (Gratuito para Desenvolvedor)

- **$0 infraestrutura** — independente do número de usuários
- Cada usuário final paga de sua própria conta Puter
- Para SaaS tradicional: o desenvolvedor paga preço oficial

#### Endpoint

```
POST https://api.puter.com/drivers/call
Content-Type: text/plain;actually=json
Authorization: Bearer <PUTER_AUTH_TOKEN>
```

#### Commercial Usage

**YELLOW** — Não proíbe explicitamente uso comercial. Não é reseller autorizado da Anthropic.

#### Vantagens
- Já implementado e funcionando
- $0 para developer (User-Pays)
- Suporta TODOS os modelos Claude
- Rate limits brandos

---

### 2. RUNAPI ✅ INTERESSANTE

**Source:** [runapi.ai](https://runapi.ai) · **Confidence:** HIGH

#### Modelos Claude

| Modelo | Input/1M | Output/1M | Cache Read | Cache Write (5m) |
|---|---|---|---|---|
| **Claude Opus 5** | **$3.00** | **$15.00** | $0.30 | $3.75 |
| **Claude Sonnet 5** | **$1.36** | **$6.78** | $0.14 | $1.70 |
| **Claude Fable 5** | $10.00 | $50.00 | $1.00 | $12.50 |
| Claude Haiku 4.5 | $0.60 | $3.00 | N/A | N/A |

**⚠️ ALERTA:** Sonnet 5 a $1.36 input vs $3.00 oficial = **55% mais barato!** Opus 5 a $3.00 vs $5.00 oficial = **40% mais barato!**

#### Free Tier

- Créditos de boas-vindas (valor não disclosure público)
- Sem cartão de crédito
- Failed generations nunca cobrados

#### Protocolos

- ✅ `POST /v1/chat/completions` (OpenAI-compatible)
- ✅ `POST /v1/messages` (Anthropic-compatible)
- ✅ Streaming SSE
- ✅ Tool calling
- 230+ modelos de 25 providers

#### Commercial Usage

**GREEN** — Explicitamente permite uso comercial (Claude Fable 5 page lista "commercial use OK").

#### Capacidade para Benchmark

- 230+ models, 25 providers — capacidade diversificada
- Para 3B tokens/mês via RunAPI (se preços forem reais):
  - Opus 5: 2.4B × $3 + 0.6B × $15 = **$16.2M/mês** (vs $21M oficial)
  - Sonnet 5: 2.4B × $1.36 + 0.6B × $6.78 = **$7.4M/mês** (vs $13.2M oficial)
  - **43-56% mais barato se preços forem reais**

#### Vantagens
- Preços significativamente menores que oficial (Sonnet 5: 55% off!)
- OpenAI + Anthropic compatible
- 230+ modelos
- Commercial use OK

#### Desvantagens
- Provider novo, sem track record
- Preços não verificados independentemente
- Rate limits não documentados publicamente

---

### 3. OPENROUTER

**Source:** [openrouter.ai](https://openrouter.ai), [docs](https://openrouter.ai/docs) · **Confidence:** HIGH

#### Modelos Claude Disponíveis

| Modelo | Input/1M | Output/1M | ID |
|---|---|---|---|
| Claude Fable 5.1 | $10.00 | $50.00 | `anthropic/claude-fable-5-1` |
| Claude Fable 5.1 (batch) | $5.00 | $25.00 | `anthropic/claude-fable-5-1-...-batch` |
| Claude Sonnet 5 | ~$2.00 | ~$10.00 | `anthropic/claude-sonnet-5` |
| Claude Opus Latest | $5.00 | $25.00 | `~anthropic/claude-opus-latest` |

#### Free Tier

| Condição | Requests/Dia | RPM |
|---|---|---|
| < $10 créditos vitalícios | 50 | 20 |
| ≥ $10 créditos vitalícios | 1.000 | 20 |

- **BYOK (Bring Your Own Key):** 1M requisições GRÁTIS por mês usando suas próprias chaves Anthropic/OpenAI/Google

**SOURCE:** [openrouter.ai/docs/api_reference/limits](https://openrouter.ai/docs/api_reference/limits) · **Confidence:** HIGH

#### Protocolos

- ✅ `POST /v1/chat/completions` (OpenAI-compatible)
- ✅ `POST /v1/responses`
- ✅ `POST /v1/messages` (Anthropic native)
- ✅ Streaming SSE
- ✅ Tool calling

#### Commercial Usage

**GREEN** — Estabelecido, uso comercial permitido. Para resale como upstream: ⚠️ YELLOW.

#### Vantagens
- Anos de operação, marca establecida
- BYOK com 1M req/mês gratuito
- Não precisa de cartão de crédito brasileiro
- Commercial OK

#### Desvantagens
- Adiciona ~5% markup
- Claude não é free-tier (free são DeepSeek, Llama, etc)

---

### 4. API.AIRFORCE

**Source:** [api.airforce](https://api.airforce), [pricing](https://api.airforce/pricing/), [Claude models](https://api.airforce/models/family/claude/) · **Confidence:** MEDIUM

#### Modelos Claude

| Modelo | Input/1M | Output/1M |
|---|---|---|
| **Claude Sonnet 5** | **$1.59** | **$7.97** |
| **Claude Opus 5** | **$3.58** | **$17.88** |
| Claude Sonnet 4.5 | $1.50 | $7.50 |
| Claude Opus 4.5 | $5.00 | $25.00 |

**⚠️ ALERTA:** Sonnet 5 a $1.59 input vs $3.00 oficial = **47% mais barato!**

#### Planos

| Plano | Preço | RPM | Req/Dia | Créditos/Mês |
|---|---|---|---|---|
| Free | $0 | 1 | 1.000 | 0 |
| Starter | $9.99 | 20 | 100 | 1.200 |
| Master | $99.99 | 80 | 1.000 | 12.000 |
| Ultra | $199.99 | 120 | 2.000 | 24.000 |

#### Commercial Usage

**YELLOW** — Não proibido explicitamente, mas termos não claros para resale.

---

### 5. ANTHROPIC API (OFICIAL)

**Source:** [platform.claude.com/docs/en/models/overview](https://platform.claude.com/docs/en/models/overview) · **Confidence:** HIGH

#### Modelos e Preços

| Modelo | ID | Input/1M | Output/1M | Contexto | Max Output |
|---|---|---|---|---|---|
| Claude Opus 5 | `claude-opus-5` | $5.00 | $25.00 | 1M | 128K |
| Claude Sonnet 5 | `claude-sonnet-5` | $3.00 | $15.00 | 1M | 128K |
| Claude Fable 5.1 | `claude-fable-5-1` | $10.00 | $50.00 | 1M | 128K |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | $1.00 | $5.00 | 200K | 64K |

#### Commercial Usage

**GREEN** — API oficial. Uso comercial, SaaS, revenda (via enterprise contract).

#### Capacidade para Benchmark

- Para 3B tokens/mês: **$5.4M-$54M/mês** (sem discount)
- Com enterprise (~40% discount): **$3.2M-$32M/mês**
- **Enterprise contract necessário** para volume > 500M tokens/mês

---

### 6. ABHIBOTS / OPUS PROXY

**Source:** [opus.abhibots.com](https://opus.abhibots.com) · **Confidence:** HIGH

#### Modelos Claude

**Todos os modelos incluindo Opus 5, Sonnet 5, Fable 5, Fable 5.1 ✅**

#### Planos

| Plano | Preço | Tokens/5h | API Keys |
|---|---|---|---|
| **Free** | ₹0 | 300.000/24h | 1 |
| Starter | ₹999/mês | 1.5M | 2 |
| Pro | ₹2.999/mês | 5M | 5 |
| Enterprise | ₹10.000/mês | 20M | 50 |

#### Free Tier

- **300.000 tokens por 24 horas** (rolling window)
- Requer login via Telegram

#### Riscos

1. **Privacidade:** Reddit reporta prompts provavelmente logados/vendidos
2. **Legalidade:** Likely viola termos da Anthropic
3. **Precário:** Serviço baseado na Índia, sem garantias
4. **Grey market:** Preços 97% menores são insustentáveis

#### Commercial Usage

**⚠️ YELLOW** — "independent reseller, not affiliated with Anthropic." Não há garantia de compliance.

---

### 7. WINKAPI

**Source:** [winkapi.net](https://winkapi.net) · **Confidence:** MEDIUM

#### Modelos Claude

**Opus 5, Sonnet 5, Fable 5 ✅**

#### Planos

| Plano | Custo | Crédito | Markup |
|---|---|---|---|
| Trial | Free | welcome credit | — |
| Pro | $9 | $20 | ~2.2x oficial |

#### ⚠️ ALERTA

- Serviço lançado ago/2026 (muito novo — ~1 mês)
- Equipe anônima
- Sem reviews independentes
- Taxa 2.2x sobre preço oficial

#### Commercial Usage

**YELLOW** — Termos existem mas operador é novo e desconhecido.

---

### 8. NEXUSAPI

**Source:** [nexusapi.one](https://nexusapi.one) · **Confidence:** MEDIUM

#### Modelos Claude

**❌ SEM Opus 5 nem Sonnet 5 — só 4.x**

| Modelo | Input/1M | Output/1M |
|---|---|---|
| Claude Opus 4.6 | $6.41 | $32.06 |
| Claude Sonnet 4.6 | $1.28 | $6.41 |
| Claude Haiku 4.5 | $0.34 | $1.71 |

#### Free Tier

- 5.000 créditos no signup
- Bônus diário por check-in

#### ⚠️ ALERTA

- Opus 4.6 a $1.28 input vs $3.00 oficial = 57% mais barato — preço insustentável
- Sem Opus 5/Sonnet 5

---

### 9. OUTROS

| Provider | Status | Notes |
|---|---|---|
| **Tokenator.cloud** | ❌ UNVERIFIED | HTTP 403 em docs, sem community presence |
| **ModelAPI** | ❌ NOT FOUND | Não existe com esse nome |
| **ChatProvider** | ❌ NOT FOUND | Não existe com esse nome |
| **VibeBuild** | ❌ NOT FOUND | É uma agência de automação, não API provider |
| **ProjectAres** | ❌ NOT FOUND | Não existe com esse nome |
| **Groq** | ✅ OK mas | Não tem Claude |
| **Fireworks AI** | ✅ OK mas | Não tem Claude |
| **AWS Bedrock** | ✅ RECOMENDADO | Preço oficial + discount negociável |
| **Google Foundry** | ✅ RECOMENDADO | Preço oficial + discount negociável |

---

## TABELA COMPARATIVA DE PREÇOS (Claude Sonnet 5 — modelo mais usado)

| Provider | Input/1M | Output/1M | vs Oficial | Confiança |
|---|---|---|---|---|
| **RunAPI** | **$1.36** | **$6.78** | **55% OFF** | 🟡 MEDIUM |
| **Api.Airforce** | **$1.59** | **$7.97** | **47% OFF** | 🟡 MEDIUM |
| **NexusAPI** | $1.28 | $6.41 | 57% OFF | 🔴 LOW |
| **AbhiBots Enterprise** | varies | varies | varies | 🔴 HIGH |
| **WinkAPI** | ~$6.60 | ~$33 | 2.2x OVER | 🔴 HIGH |
| **OpenRouter** | ~$2.00 | ~$10.00 | 0% | ✅ HIGH |
| **Puter** | $3.00 | $15.00 | 0% | ✅ HIGH |
| **Anthropic API** | $3.00 | $15.00 | — | ✅ HIGH |

---

## ANÁLISE ECONÔMICA (3B tokens/mês, mix 80/20 input/output)

### Cenário Realista

| Provider | Custo Estimado | vs Oficial | Viabilidade |
|---|---|---|---|
| **RunAPI** (se preços reais) | ~$7.4M/mês | 43% OFF | ⚠️ Se sustentável |
| **Api.Airforce** (se preços reais) | ~$8.1M/mês | 40% OFF | ⚠️ Se sustentável |
| **OpenRouter** | ~$17M/mês | +5% | ⚠️ Adiciona custo |
| **Anthropic oficial** | ~$13.2M/mês | 0% | ⚠️ Muito alto |
| **Enterprise Anthropic** (~40% off) | ~$7.9M/mês | 40% OFF | ✅ Caminho certo |

**Realidade:** Para 3B tokens/mês, qualquer caminho é caríssimo. O modelo de negócio precisa cobrar muito mais do que o custo para sobreviver.

---

## TIER RANKING FINAL

### TIER S — Excelente

| Provider | Notes |
|---|---|
| **AWS Bedrock / Google Cloud / Azure Foundry** | Preço oficial, compliance total, enterprise-ready. **Caminho correto para volume enterprise.** |

### TIER A — Muito Interessante

| Provider | Notes |
|---|---|
| **RunAPI** | Sonnet 5 55% off, Opus 5 40% off. 230+ modelos. Commercial OK. **Mais promissor se preços forem reais.** |
| **OpenRouter** | Estabelecido, BYOK 1M req/mês free, commercial OK. **Fallback #1.** |
| **Puter** | Já implementado, $0 dev (User-Pays), todos modelos. **Fallback #0 gratuito.** |

### TIER B — Bom para Testes

| Provider | Notes |
|---|---|
| **Api.Airforce** | Sonnet 5 47% off. 620+ modelos. **Testar preços reais.** |
| **AbhiBots** | Free tier 300K/24h. **Para testes, NÃO produção.** |

### TIER C — Experimental

| Provider | Notes |
|---|---|
| **NexusAPI** | Sem Opus 5/Sonnet 5, preços suspeitos. Só para modelos 4.x. |

### TIER D — NÃO RECOMENDADO

| Provider | Notes |
|---|---|
| **WinkAPI** | 2.2x markup, serviço novo (~1 mês), operador desconhecido. |
| **Grey market proxies** | Privacidade extrema, legalidade duvidosa. |

---

## ARQUITETURA RECOMENDADA

```
Cliente
  ↓
Consecom API (auth + credits + rate limiting)
  ↓
Smart Router
  ↓
┌──────────────────────────────────────────────────┐
│ PROVIDER POOL                                     │
│                                                   │
│ 1. Puter         — $0 dev, todos modelos       │
│    (fallback: 502, timeout, 429, rate limit)    │
│                                                   │
│ 2. RunAPI         — Sonnet 5 55% off!          │
│    (fallback: verificar preços, 502)               │
│                                                   │
│ 3. Api.Airforce   — Sonnet 5 47% off           │
│    (fallback: verificar preços)                   │
│                                                   │
│ 4. OpenRouter     — BYOK free 1M req/mês       │
│    (fallback: markup 5%)                          │
│                                                   │
│ 5. OpenRouter paid — markup 5%                  │
│    (fallback: enterprise)                         │
│                                                   │
│ 6. AWS Bedrock     — enterprise pricing         │
│    (último fallback)                             │
└──────────────────────────────────────────────────┘
```

---

## PRÓXIMOS PASSOS

1. ✅ **Puter** — Implementado e testado (100%)
2. ⬜ **RunAPI adapter** — Criar adapter, testar preços reais
3. ⬜ **Api.Airforce adapter** — Criar adapter, testar preços reais
4. ⬜ **OpenRouter adapter** — Criar adapter com BYOK support
5. ⬜ **Smart Router** — Implementar fallback automático por provider
6. ⬜ **Enterprise negotiation** — Contatar Anthropic ou cloud provider para discount

---

## FONTES

| Provider | Fontes | Confiança |
|---|---|---|
| Anthropic API | platform.claude.com/docs | ✅ HIGH |
| OpenRouter | openrouter.ai/docs | ✅ HIGH |
| RunAPI | runapi.ai/* | 🟡 MEDIUM (precisa testar) |
| Api.Airforce | api.airforce/* | 🟡 MEDIUM (precisa testar) |
| AbhiBots | opus.abhibots.com/* | 🟡 MEDIUM (user reports) |
| Puter | developer.puter.com/* | ✅ HIGH (testado) |
| WinkAPI | winkapi.net/* | 🟡 MEDIUM (site only) |
| NexusAPI | nexusapi.one | 🟡 MEDIUM (site only) |
| Aws/GCP/Azure | aws.amazon.com, cloud.google.com | ✅ HIGH |
