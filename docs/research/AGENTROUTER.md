# Pesquisa — AgentRouter

> Gerado em: 2026-09-26
> Fonte primária validada contra o artigo do Stackademic.

---

## TL;DR
- **Viável para uso comercial como gateway comercial (Consecom Routing)?** PARCIAL / REQUER ANÁLISE LEGAL
- **Bloqueios:** Termos proíbem "revenda, redistribuição ou uso não autorizado por terceiros" — isso PODE atingir uso em SaaS multi-tenant. Requer confirmação jurídica.
- **Custo:** ~27% do preço oficial das APIs. Créditos gratuitos: $100-$200.
- **Confiabilidade:** ALERTA — múltiplos relatos de instabilidade em ago/set 2026 (erros 402, contas desativadas).

---

## 1. Identidade

| Campo | Valor |
|-------|-------|
| **Operador** | Iniciativa não-comercial (non-profit), operada de Singapura/China |
| **Site principal** | https://agentrouter.org |
| **Documentação API** | https://docs.agentrouter.to |
| **Portal de Agents** | https://agent-router.org |
| **Portal Enterprise** | https://co.agentrouter.org |
| **Repo GitHub** | NÃO ENCONTRADO — não há repositório público confirmado |
| **Twitter/X** | https://x.com/agentrouter |
| **Email de contato** | neo@agentrouter.org |
| **Natureza jurídica** | Gateway de API não-comercial inspirado no OpenRouter |

**Nota sobre operador:** Não há empresa legalmente identificada nos documentos. O operador parece ser um grupo informal/sem fins lucrativos, possivelmente baseado na China. NÃO é uma entidade corporativa estabelecida.

---

## 2. Endpoint

| Campo | Valor |
|-------|-------|
| **Base URL (padrão)** | `https://agentrouter.org/v1` |
| **Base URL (alternativa)** | `https://agentrouter.org/` (para compatibilidade Anthropic) |
| **Compatível com** | OpenAI `/v1/chat/completions` |
| **Autenticação** | Bearer Token via header `Authorization` |

### Headers recomendados
```
Authorization: Bearer sk-your-agentrouter-key-here
```

### Exemplo curl
```bash
curl https://agentrouter.org/v1/chat/completions \
  -H "Authorization: Bearer sk-your-agentrouter-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Endpoints documentados
| Método | Endpoint | Função |
|--------|----------|--------|
| GET | `/v1/models` | Lista modelos disponíveis |
| POST | `/v1/chat/completions` | Chat completion (OpenAI-compatible) |
| GET | `/wallet` | Saldo de créditos |
| GET | `/usage` | Histórico de uso |

---

## 3. OpenAI Compatibility

| Feature | Status |
|---------|--------|
| `/v1/chat/completions` | **Suportado** |
| `/v1/models` | **Suportado** |
| Streaming (SSE) | **Suportado** |
| Tool use / Function calling | **Suportado** (verificado em fontes) |
| Vision / Image input | NÃO VALIDADO |
| JSON mode | NÃO VALIDADO |

**Diff com OpenAI oficial:** A API é compatível em superfície, mas pode haver diferenças em parâmetros específicos de provedores (ex: modelos de raciocínio como DeepSeek o-series podem retornar erros 400 com `reasoning_content`).

---

## 4. Modelos Disponíveis

### Modelos Confirmados (ID exato)

| Display | ID na API | Provedor | Notas |
|---------|----------|----------|-------|
| Claude Opus 4.8 | `claude-opus-4-8` | Anthropic | Tier Frontier |
| Claude Opus 5 | `claude-opus-5` | Anthropic | 1M contexto (Mastra) |
| Claude Sonnet 4.5 | `claude-sonnet-4-5-20250929` | Anthropic | Recomendado para Claude Code |
| Claude Sonnet 4.5 (antigo) | `claude-sonnet-4-5-20250514` | Anthropic | Versão anterior |
| Claude Sonnet 4 | NÃO CONFIRMADO | Anthropic | Mencionado em tiers |
| Claude Haiku 3.5 | `claude-haiku-3-5-20241022` | Anthropic | Legado, sendo descontinuado |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | Anthropic | Leve/rápido |
| GPT-5.5 | `gpt-5.5` ou similar | OpenAI | Tier Frontier |
| GPT-5.4 | NÃO CONFIRMADO | OpenAI | — |
| GPT-5 | NÃO CONFIRMADO | OpenAI | Mencionado |
| DeepSeek R1 | `deepseek-r1` | DeepSeek | Raciocínio |
| DeepSeek V4 Pro | NÃO CONFIRMADO | DeepSeek | Custo-efetivo |
| DeepSeek V4 Flash | NÃO CONFIRMADO | DeepSeek | Bulk |
| GLM-4.5 Air | `GLM-4.5-Air` | Zhipu AI | Gratuito, 128K |
| GLM-4.6 | `GLM-4.6` | Zhipu AI | Gratuito, 128K |
| GLM-5.1 | NÃO CONFIRMADO | Zhipu AI | — |
| Gemini 3 Flash | NÃO CONFIRMADO | Google | Bulk |
| Gemini 3 Pro | NÃO CONFIRMADO | Google | Premium |
| Kimi K2.6 | NÃO CONFIRMADO | Moonshot | Bulk |
| Mistral-7B-Instruct | `mistral-7b-instruct` | Mistral AI | Gratuito, 32K |
| Qwen2-7B-Instruct | `qwen2-7b-instruct` | Alibaba | Gratuito, 32K |

### Modelos Gratuitos (sem consumir créditos)
- GLM-4.5 Air (Zhipu AI) — 128K contexto
- GLM-4.6 (Zhipu AI) — 128K contexto
- DeepSeek-V2 Lite (DeepSeek) — 32K contexto
- Qwen2-7B-Instruct (Alibaba) — 32K contexto
- Mistral-7B-Instruct (Mistral AI) — 32K contexto

**TOTAL DE MODELOS VALIDOS:** ~15+ modelos confirmados, dezenas listados em fontes secundárias.

---

## 5. Preços / Créditos / Limites

### Créditos Iniciais
| Método | Valor |
|--------|-------|
| Cadastro padrão | **$100** |
| Cadastro via referral | **$200** |
| Cartão de crédito | **NÃO NECESSÁRIO** |

### Preços (relativos à API oficial)
| Tier | Preço vs API oficial |
|------|---------------------|
| Padrão | ~27% do preço público |
| Bulk/Flash | Muito baixo ($0.075/1M input) |
| Enterprise | Sob consulta (neo@agentrouter.org) |

### Rate Limits
| Campo | Status |
|-------|--------|
| RPM/TPM | **NÃO DOCUMENTADO** |
| Limite semanal | **NENHUM** (confirmado) |
| Quota por membro (Enterprise) | Configurável |

### Enterprise
- Preços sob medida
- Rateios mensais + limites por colaborador
- Gestão multi-tenant, SSO, RBAC
- Suporte dedicado e disaster recovery
- Contato: neo@agentrouter.org

### Obtenção de API Key
1. Registro em: https://agentrouter.org/register?aff=DWBb
2. Login via GitHub (uma fonte reporta que contas GitHub com menos de 1 ano podem ter autorização negada)
3. Console de tokens: https://agentrouter.org/console/token

---

## 6. Streaming + Tool Use

| Feature | Status | Notas |
|---------|--------|-------|
| SSE Streaming | **Suportado** | Mesma interface OpenAI |
| Tool use / Function calling | **Suportado** | Confirmado em documentação Mastra e experiências de usuário |
| Vision | **NÃO VALIDADO** | — |
| JSON mode | **NÃO VALIDADO** | — |

**Nota sobre modelos de raciocínio:** Modelos como DeepSeek o-series e R1 podem retornar erros 400 com `reasoning_content`. Requer tratamento especial na aplicação.

---

## 7. Uso Comercial

| Tópico | Status | Fonte | Citação |
|--------|--------|-------|---------|
| Uso comercial direto | **PERMITIDO** | Termos Art. 7 | "Modelos disponíveis conforme lista da plataforma" |
| Revenda/redistribuição | **PROIBIDO** | Termos Art. 6(k) | "Revenda, redistribuição ou uso não autorizado por terceiros" |
| Uso em SaaS multi-tenant | **INCERTO** | Termos Art. 6(k) | "Uso não autorizado por terceiros" — REQUER INTERPRETAÇÃO LEGAL |
| Uso em produto final do cliente | **INCERTO** | Termos Art. 6(k) | Mesma cláusula — REQUER ANÁLISE LEGAL |
| Conteúdo do usuário para treino | **PROIBIDO** | Termos Art. 5 | "AgentRouter não usa conteúdo para treinar modelos" |
| Dados sensíveis (PII) | **NÃO RECOMENDADO** | Gist | "Prompts e respostas passam pela infraestrutura do proxy" |

### Citação textual dos Termos (Art. 6k)
> "Revenda, redistribuição ou uso não autorizado por terceiros."

**URL dos Termos:** https://co.agentrouter.org/portal/terms

### Análise de Risco para Consecom Routing
**Ponto Crítico:** A cláusula "uso não autorizado por terceiros" pode atingir:
- SaaS onde clientes finais consomem APIs via gateway
- Revenda de acesso (mesmo que transparente)
-white-label

**Recomendação:** Análise jurídica obrigatória antes de uso comercial. O operador NÃO é uma entidade corporativa — isso limita recursos legais em caso de disputa.

---

## 8. Claude Code Compatibility

| Aspecto | Status | Configuração |
|---------|--------|--------------|
| **Funciona?** | **SIM (relatado)** | Múltiplos usuários confirmam uso com Claude Code |
| **Tool use** | **Funciona** | Confirmado em experiências de usuário |
| **Opus 5** | **Funciona** | "working really well with opus-5 model without limitations" |

### Configuração Necessária

**Opção 1 (Variáveis Anthropic):**
```bash
export ANTHROPIC_BASE_URL="https://agentrouter.org/"
export ANTHROPIC_AUTH_TOKEN="sk-your-agentrouter-key-here"
export ANTHROPIC_API_KEY="sk-your-agentrouter-key-here"
export ANTHROPIC_MODEL="claude-sonnet-4-5-20250929"
```

**Opção 2 (Python SDK):**
```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-your-agentrouter-key-here",
    base_url="https://agentrouter.org/v1",
)

response = client.chat.completions.create(
    model="claude-sonnet-4-5-20250929",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

### Modelos Recomendados para Claude Code
| Modelo | Uso |
|--------|-----|
| `claude-sonnet-4-5-20250929` | Melhor equilíbrio custo/qualidade |
| `claude-opus-4-8` | Tarefas complexas |
| `claude-haiku-3-5-20241022` | Edições rápidas |

### Compatível também com
- Roo Code
- Kilo Code
- Cline
- Cursor
- n8n

---

## 9. Confiabilidade

| Aspecto | Status | Notas |
|---------|--------|-------|
| **Status page** | **NÃO ENCONTRADO** | Não há status page pública |
| **Uptime SLA** | **NENHUM** | "Serviço fornecido como está" |
| **Incidentes recentes** | **ALERTA** | Erros 402, contas desativadas em ago/set 2026 |
| **Latência** | **~80-150ms** | Baseado em Singapura |

### Relatos de Problemas (ago/set 2026)
- Erros 402 "quota exhausted"
- Contas desativadas sem aviso
- Saldo zerando sem uso
- "SCAM 100%" — um relato

### Riscos Identificados
1. **Sustentabilidade:** Projeto não-comercial pode descontinuar
2. **Operacional:** Instabilidade recente em produção
3. **Legal:** Sem entidade corporativa identificável
4. **Privacidade:** Dados passam por infraestrutura de terceiros
5. **Suporte:** Apenas comunidade/email

---

## 10. Riscos

| Risco | Nível | Mitigação |
|-------|-------|-----------|
| Descontinuação do serviço | **ALTO** | Ter plano de migração |
| Uso comercial em SaaS | **ALTO** | Análise jurídica obrigatória |
| Instabilidade operacional | **MÉDIO** | Não usar para produção crítica |
| Sem recurso legal | **ALTO** | Não há entidade corporativa |
| Vazamento de dados | **MÉDIO** | Não enviar PII ou dados sensíveis |
| Revenda proibida | **ALTO** | Cláusula explícita nos termos |

---

## 11. Próximos Passos

1. **[CRÍTICO]** Análise jurídica dos Termos Art. 6(k) sobre "uso não autorizado por terceiros" — impacta diretamente o modelo SaaS do Consecom Routing
2. **[ALTO]** Contato com neo@agentrouter.org para esclarecer termos comerciais e disponibilidade enterprise
3. **[MÉDIO]** Teste prático com sandbox: configurar AgentRouter como provider no Consecom Routing e validar tool use
4. **[MÉDIO]** Verificar estabilidade do serviço por 2-4 semanas antes de considerar produção
5. **[BAIXO]** Documentar fallback para APIs diretas (Anthropic/OpenAI) caso AgentRouter apresente problemas

---

## Fontes

- [AgentRouter - Gist Definitive Guide](https://gist.github.com/mzaman/a9409de6ccaa19044fb564936b8c9c4f)
- [AgentRouter Review - $200 Free](https://gist.github.com/zabih3/28d5e5918840516f06b8a2dc75113c76)
- [AgentRouter Docs](https://docs.agentrouter.to/welcome)
- [AgentRouter Portal](https://agent-router.org/)
- [AgentRouter Pricing](https://co.agentrouter.org/portal/pricing)
- [AgentRouter Terms](https://co.agentrouter.org/portal/terms)
- [CodeRouter Models Guide](https://www.coderouter.io/blog/agent-router-models-2026)
- [Mastra AI - AgentRouter Provider](https://mastra.ai/models/providers/agentrouter)

---

## Validação vs Artigo Stackademic

| Afirmação do Artigo | Status | Validação |
|---------------------|--------|-----------|
| $200 créditos gratuitos | **VALIDADO** | Via referral |
| Funciona com Claude Code | **VALIDADO** | Múltiplas fontes |
| Endpoint `https://agentrouter.org/v1` | **VALIDADO** | Documentação |
| OpenAI-compatible | **VALIDADO** | Documentação |
| Models Opus 4.8, 5 | **VALIDADO** | Mastra AI |
| Tool use funciona | **VALIDADO** | Relatos de usuários |
| Uso comercial permitido | **INCERTO** | Termos ambíguos |
| Confiável para produção | **NÃO VALIDADO** | Relatos de instabilidade |

---

*Pesquisa concluída. Recomenda-se análise legal antes de qualquer uso comercial.*
