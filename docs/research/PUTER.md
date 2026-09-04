# Pesquisa - Puter

> Gerado em 2026-09-28
> Objetivo: integrar Puter como provider de IA no gateway Consecom.

## TL;DR
- Integracao viavel: **PARCIAL** (via OpenAI-compatible endpoint)
- Bloqueios comerciais: **TERMOS PROIBEM uso comercial** explicitamente
- Auth recomendada: `PUTER_AUTH_TOKEN` (server-side) ou SDK Puter.js (browser)
- Endpoint OpenAI-compatible: `https://api.puter.com/puterai/openai/v1/chat/completions`
- 85+ modelos disponiveis (Anthropic, OpenAI, Google, xAI, DeepSeek, etc.)

---

## 1. Puter.js (cliente browser)

### URL de carregamento
```html
<script src="https://js.puter.com/v2/"></script>
```
Ou via npm:
```bash
npm install @heyputer/puter.js
```

### API surface

#### Funcao principal
```javascript
puter.ai.chat(prompt, options)
puter.ai.chat(messages, options)  // messages = [{role, content}]
```

#### Assinaturas completas
```javascript
// Nao-streaming
puter.ai.chat("prompt", { model: 'anthropic/claude-sonnet-5' })
  .then(response => response.message.content[0].text);

// Streaming
const resp = await puter.ai.chat("prompt", {
  model: 'anthropic/claude-sonnet-5',
  stream: true
});
for await (const part of resp) {
  if (part.type === 'text') console.log(part.text);
}
```

#### Opcoes disponiveis
| Opcao | Tipo | Default | Descricao |
|-------|------|---------|-----------|
| `model` | String | `gpt-5-nano` | ID do modelo |
| `provider` | String | auto | Provedor especifico |
| `stream` | Boolean | `false` | Streaming SSE |
| `max_tokens` | Number | model default | Max tokens de output |
| `temperature` | Number | model default | 0-2 |
| `tools` | Array | - | Function-calling (JSON Schema) |
| `reasoning_effort` | String | - | none/minimal/low/medium/high/xhigh |
| `normalize` | Boolean | release-date | Normaliza para formato OpenAI |

### Autenticacao

**Browser**: Automatico via popup
```javascript
puter.auth.signIn();  // dispara popup de login
puter.auth.isSignedIn();
puter.auth.getUser();
```

**Node.js/Server-side**:
```javascript
import { init } from "@heyputer/puter.js/src/init.cjs";
const puter = init(process.env.PUTER_AUTH_TOKEN);
```

---

## 2. Server-to-server / API direta

### Endpoint real
```
https://api.puter.com/puterai/openai/v1/chat/completions
```

### Headers obrigatorios
```
Authorization: Bearer YOUR_PUTER_AUTH_TOKEN
Content-Type: application/json
```

### Formato do request
```json
POST /chat/completions
{
  "model": "anthropic/claude-sonnet-5",
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
```

### cURL exemplo
```bash
curl https://api.puter.com/puterai/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PUTER_AUTH_TOKEN" \
  -d '{"model": "anthropic/claude-sonnet-5", "messages": [{"role": "user", "content": "Hello"}]}'
```

### Como obter token
1. Acessar https://puter.com/dashboard#account
2. Secao "API token" -> "Create token"
3. Copiado automaticamente para clipboard
4. Armazenar em variavel de ambiente `PUTER_AUTH_TOKEN`

### Modelo de cobranca User-Pays
- **Browser**: Usuario final paga via conta Puter
- **Server-side**: Mesma logica - cada requisicao consome credits da conta associada ao token
- **Desenvolvedor**: Custo zero de infraestrutura

---

## 3. OpenAI compatibility

### URL
```
https://api.puter.com/puterai/openai/v1/
```

### Diferencas vs OpenAI
- Mesma estrutura de request/response
- Mesmos parametros (`model`, `messages`, `temperature`, `max_tokens`, `stream`)
- Chunk de streaming identico ao OpenAI (`delta.content`)
- Suporta todos os modelos (Claude, GPT, Gemini, Grok, etc.) trocando apenas o `model`

### Setup com SDK OpenAI
```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.puter.com/puterai/openai/v1/",
  apiKey: process.env.PUTER_AUTH_TOKEN,
});

const response = await client.chat.completions.create({
  model: "anthropic/claude-sonnet-5",
  messages: [{ role: "user", content: "Hello" }],
});
```

---

## 4. Modelos disponiveis (com ID exato)

### Anthropic
| Display name | Model ID real | Custo Input | Custo Output |
|-------------|--------------|-------------|--------------|
| Claude Fable 5.1 | `anthropic/claude-fable-5-1` | $10/1M | $50/1M |
| Claude Fable 5 | `anthropic/claude-fable-5` | $10/1M | $50/1M |
| Claude Opus 5 | `anthropic/claude-opus-5` | $5/1M | $25/1M |
| Claude Opus 5 Fast | `anthropic/claude-opus-5-fast` | $10/1M | $50/1M |
| Claude Sonnet 5 | `anthropic/claude-sonnet-5` | $3/1M | $15/1M |
| Claude Opus 4.8 | `anthropic/claude-opus-4-8` | $5/1M | $25/1M |

### OpenAI
| Display name | Model ID real | Custo Input | Custo Output |
|-------------|--------------|-------------|--------------|
| GPT-5.6 Sol | `openai/gpt-5.6-sol` | $2/1M | $10/1M |
| GPT-5.6 Terra | `openai/gpt-5.6-terra` | $1/1M | $6/1M |
| GPT-5.6 Luna Pro | `openai/gpt-5.6-luna-pro` | $0.20/1M | $1.20/1M |
| GPT-5.6 Luna | `openai/gpt-5.6-luna` | $0.10/1M | $0.60/1M |

### Google
| Display name | Model ID real | Custo Input | Custo Output |
|-------------|--------------|-------------|--------------|
| Gemini 3.7 Flash | `google/gemini-3.7-flash` | $0.75/1M | $3.75/1M |
| Gemini 3.5 Flash | `google/gemini-3.5-flash` | $1.50/1M | $9/1M |
| Gemini 3.5 Flash-Lite | `google/gemini-3.5-flash-lite` | $0.30/1M | $2.50/1M |

### xAI (Grok)
| Display name | Model ID real | Custo Input | Custo Output |
|-------------|--------------|-------------|--------------|
| Grok 4.6 | `x-ai/grok-4.6` | $1.60/1M | $4.80/1M |
| Grok 4.5 | `x-ai/grok-4.5` | $1.60/1M | $4.80/1M |
| Grok 4.3 | `x-ai/grok-4.3` | $1.25/1M | $2.50/1M |

### DeepSeek
| Display name | Model ID real | Custo Input | Custo Output |
|-------------|--------------|-------------|--------------|
| DeepSeek V4 Pro 0813 | `deepseek/deepseek-v4-pro-0813` | $1.32/1M | $3.96/1M |
| DeepSeek V4 Flash 0731 | `deepseek/deepseek-v4-flash-0731` | $0.44/1M | $1.32/1M |

### Qwen
| Display name | Model ID real | Custo Input | Custo Output |
|-------------|--------------|-------------|--------------|
| Qwen3.8 Flash | `qwen/qwen3.8-flash` | $0.06/1M | $0.19/1M |
| Qwen3.7 Flash | `qwen/qwen3.7-flash` | $0.03/1M | $0.13/1M |

### Modelos gratuitos
| Model ID | Tipo |
|----------|------|
| `nvidia/nemotron-3.5-content-safety:free` | seguranca |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | multimodal |
| `inclusionai/ling-3.0-flash-fin:free` | financas |
| `cohere/north-mini-code:free` | codigo |
| `dots-studio/dots-3-note-preview:free` | multimodal |

**Total**: 85+ modelos listados na documentacao.

---

## 5. Streaming

### Formato
SSE (Server-Sent Events) - padrao OpenAI-compatible

### Exemplo de codigo
```javascript
// Via OpenAI SDK
const stream = await client.chat.completions.create({
  model: "anthropic/claude-sonnet-5",
  messages: [{ role: "user", content: "Hello" }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}

// Via Puter SDK
const resp = await puter.ai.chat("prompt", { stream: true });
for await (const part of resp) {
  if (part.type === 'text') text += part.text;
  if (part.type === 'tool_use') handleTool(part);
}
```

### Estrutura do chunk
```json
{
  "choices": [{
    "delta": {
      "content": "fragmento da resposta"
    }
  }]
}
```

---

## 6. Limites observados

### Rate Limits (AI)

| Plano | Requests/10s | Concurrentes |
|-------|--------------|--------------|
| Paid | 200 | 20 |
| Free | 30 | 3 |
| Anonymous | 20 | 2 |

### Key-Value Store
| Operacao | Paid | Free | Anon |
|----------|------|------|------|
| get/set por 10s | 400 | 400 | 200 |
| list por min | 240 | 120 | 60 |
| Concurrentes | 30 | 15 | 8 |

### Limites de tamanho
| Recurso | Limite |
|---------|--------|
| Max key (KV) | 1 KB |
| Max value (KV) | 400 KB |
| Shared budget | 8,000 calls/min por conta |
| Max timeout | UNKNOWN - nao documentado |

### Planos disponiveis
| Plano | Rate Limit AI |
|-------|--------------|
| Starter | 100 requests/min |
| Professional | 1,000 requests/min |
| Enterprise | 10,000 requests/min |
| Ultimate | 100,000 requests/min |

### Endpoints OpenAI/Anthropic-compatibles
Requerem **plano pago** para acesso.

---

## 7. Uso comercial

| Topico | Status | Fonte (URL) | Citacao |
|--------|--------|-------------|---------|
| Uso comercial | **BLOQUEADO** | https://puter.com/terms | "you may not use the Services for any commercial, political, or unauthorized purpose" |
| Licenca | **BLOQUEADO** | https://puter.com/terms | "limited" e "non-commercial" license |
| Redistribuicao | **BLOQUEADO** | https://puter.com/terms | "may not be downloaded, copied, reproduced, distributed, transmitted, broadcast, displayed, sold, licensed, or otherwise exploited for any purpose whatsoever" |
| Proxy/Gateway | **BLOQUEADO** | https://puter.com/terms | "use any robot, bot, spider, crawler, scraper, site search/retrieval application, proxy or other manual or automatic device" |
| Aplicacoes de terceiros | **BLOQUEADO** | https://puter.com/terms | "use or develop any third-party applications that interact with the Services" |
| Incorporar em outro produto | **BLOQUEADO** | https://puter.com/terms | "incorporate or combine any part of the Services with other software" |
| User-Pays Model | **PERMITIDO** | https://developer.puter.com/ | "developers pay $0 for infrastructure regardless of user count" |
| Open Source | **PERMITIDO** | https://github.com/HeyPuter/puter | Projeto open-source no GitHub |

### Clausulas problematicas para o Consecom Routing

**Secao 8 - Proibicoes**:
> "use any robot, bot, spider, crawler, scraper, site search/retrieval application, **proxy** or other manual or automatic device, method or process to access, retrieve, index, 'data mine' or in anyway reproduce or circumvent the navigational structure or presentation of the Services"

> "**use or develop any third-party applications that interact with the Services**"

> "**incorporate or combine any part of the Services** with other software"

> "**use the Services for any commercial**... purpose"

---

## 8. Casos especiais

### Cloudflare Worker
- **Funciona**: Puter oferece Serverless Workers proprios (alternativa ao Cloudflare Workers)
- **Deployment**: Via CLI `puter worker deploy` ou GitHub Actions
- **Integracao AI**: Worker tem acesso a `puter.kv`, `puter.fs`, `puter.ai`

### IP dinamico / NAT
- **Funciona**: Nao ha restricao de IP documentada
- **Nota**: Requer que o usuario final tenha conta Puter ativa para User-Pays

### CORS
- **Browser**: Puter.js gerencia CORS automaticamente
- **Solucao alternativa**: `puter.net.fetch()` para requests CORS-free via protocolo WISP (WebSocket proxy)
- **Server-side**: Nao aplica (nao ha restricao CORS)

---

## 9. Riscos e unknowns

### Bloqueios criticos
1. **Termos de Uso**: Uso comercial explicitamente proibido
2. **Proxy/Gateway**: Proibido pelos termos
3. **Aplicacoes de terceiros**: Proibido desenvolver apps que interagem com o servico
4. **Revenda**: Proibida redistribuicao

### Unknowns (requerem confirmacao legal)
1. Se ha excecao para integracao tecnica (nao-comercial)
2. Se "third-party applications" se aplica a integracoes via API padrao
3. Se o modelo User-Pays muda a classificacao de "uso comercial"
4. Se ha Enterprise plan com termos diferentes

### Limites tecnicos desconhecidos
1. Max tokens de output por modelo
2. Max context window
3. Timeout de requisicao
4. Suporte a tool_use via OpenAI-compatible endpoint
5. Quotas especificas por modelo

---

## 10. Proximos passos praticos

1. **REVISAO LEGAL OBRIGATORIA**: Consultar advogado sobre interpretacao dos termos de uso antes de qualquer integracao comercial
2. **Contatar Puter**: Solicitar informacoes sobre programa de parceiros/API enterprise
3. **Alternativas**: Considerar provedores com termos mais permissivos se uso comercial e prioritario
4. **Se prosseguir**: Testar integracao tecnica via OpenAI-compatible endpoint
5. **Monitorar**: Verificar se Puter oferece planos comerciais no futuro

---

## Fontes consultadas

- https://developer.puter.com/tutorials/free-unlimited-claude-35-sonnet-api/
- https://developer.puter.com/
- https://docs.puter.com/
- https://docs.puter.com/AI/chat/
- https://docs.puter.com/rate-limits-and-quotas/
- https://docs.puter.com/Workers/
- https://developer.puter.com/tutorials/use-openai-sdk-with-puter/
- https://developer.puter.com/tutorials/puter-auth-token/
- https://developer.puter.com/tutorials/puter-js-node-js/
- https://developer.puter.com/tutorials/cors-free-fetch-api/
- https://developer.puter.com/tutorials/access-perplexity-using-openai-compatible-api/
- https://developer.puter.com/ai/models/
- https://puter.com/terms
- https://github.com/HeyPuter/puter
