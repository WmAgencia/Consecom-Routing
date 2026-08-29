import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentação — Consecom Routing',
};

const codeClass = 'mt-2 overflow-x-auto rounded-md bg-bg-panel p-3 font-mono text-xs';

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-accent">
        ← voltar
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Documentação</h1>
      <p className="mt-2 text-fg-muted">
        Como usar a API do Consecom Routing a partir de qualquer ferramenta.
      </p>

      {/* Quickstart */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">1. Quickstart</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm text-fg-muted">
          <li>Crie uma conta e compre um plano.</li>
          <li>Ative sua assinatura pelo webhook Stripe.</li>
          <li>Gere uma API Key no painel.</li>
          <li>Configure sua ferramenta com a base URL + Bearer.</li>
          <li>Faça sua primeira requisição.</li>
        </ol>
      </section>

      {/* Base URL */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">2. Base URL</h2>
        <pre className={codeClass}>https://api.consecomrouting.com/v1</pre>
        <p className="mt-2 text-sm text-fg-muted">
          Em dev: <code className="font-mono">http://localhost:3001/v1</code>.
        </p>
      </section>

      {/* Auth */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">3. Autenticação</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Toda requisição deve incluir sua API Key no header{' '}
          <code className="font-mono">Authorization</code>:
        </p>
        <pre className={codeClass}>
{`Authorization: Bearer sk_cr_live_xxxxxxxxxxxxxxxxxxxxxxxx`}
        </pre>
        <p className="mt-2 text-sm text-fg-muted">
          Sua key nunca é enviada para o provider — toda chamada passa pelo gateway.
        </p>
      </section>

      {/* Models */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">4. Listar modelos</h2>
        <pre className={codeClass}>
{`curl https://api.consecomrouting.com/v1/models \\
  -H "Authorization: Bearer sk_cr_live_xxx"`}
        </pre>
        <p className="mt-2 text-sm text-fg-muted">
          Retorna apenas os modelos permitidos no seu plano.
        </p>
      </section>

      {/* Chat completion */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">5. Chat completion</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Compatível com o formato OpenAI Chat Completions:
        </p>
        <pre className={codeClass}>
{`curl -X POST https://api.consecomrouting.com/v1/chat/completions \\
  -H "Authorization: Bearer sk_cr_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-5",
    "messages": [
      {"role": "system", "content": "Você é um assistente conciso."},
      {"role": "user", "content": "Olá!"}
    ],
    "temperature": 0.7,
    "max_tokens": 1024
  }'`}
        </pre>

        <h3 className="mt-6 text-lg font-semibold">Resposta</h3>
        <pre className={codeClass}>
{`{
  "id": "req_xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "claude-sonnet-4-5",
  "choices": [
    {
      "index": 0,
      "message": {"role": "assistant", "content": "Olá! Como posso ajudar?"},
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 18,
    "completion_tokens": 9,
    "total_tokens": 27
  }
}`}
        </pre>
      </section>

      {/* Headers de resposta */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">6. Headers de resposta</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-fg-muted/15">
          <table className="w-full text-sm">
            <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
              <tr>
                <th className="px-4 py-3">Header</th>
                <th className="px-4 py-3">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-fg-muted/10">
                <td className="px-4 py-3 font-mono">X-Request-Id</td>
                <td className="px-4 py-3 text-fg-muted">
                  Identificador único — útil para suporte.
                </td>
              </tr>
              <tr className="border-t border-fg-muted/10">
                <td className="px-4 py-3 font-mono">X-Credits-Consumed</td>
                <td className="px-4 py-3 text-fg-muted">
                  Créditos desta requisição.
                </td>
              </tr>
              <tr className="border-t border-fg-muted/10">
                <td className="px-4 py-3 font-mono">X-Cost-Cents</td>
                <td className="px-4 py-3 text-fg-muted">
                  Custo real em USD cents (provider cost).
                </td>
              </tr>
              <tr className="border-t border-fg-muted/10">
                <td className="px-4 py-3 font-mono">X-RateLimit-Limit</td>
                <td className="px-4 py-3 text-fg-muted">
                  Limite de requests/min do seu plano.
                </td>
              </tr>
              <tr className="border-t border-fg-muted/10">
                <td className="px-4 py-3 font-mono">X-RateLimit-Remaining</td>
                <td className="px-4 py-3 text-fg-muted">
                  Requests restantes na janela atual.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Erros */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">7. Códigos de erro</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Toda resposta de erro tem a forma:
        </p>
        <pre className={codeClass}>
{`{
  "code": "insufficient_credits",
  "message": "insufficient credits: available 0, requested 4500",
  "status": 402,
  "request_id": "req_abc123"
}`}
        </pre>
        <div className="mt-4 overflow-hidden rounded-lg border border-fg-muted/15">
          <table className="w-full text-sm">
            <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
              <tr>
                <th className="px-4 py-3">HTTP</th>
                <th className="px-4 py-3">code</th>
                <th className="px-4 py-3">Quando</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['401', 'unauthorized', 'API key inválida ou expirada'],
                ['402', 'insufficient_credits', 'Sem créditos disponíveis'],
                ['402', 'subscription_expired', 'Assinatura expirada'],
                ['403', 'forbidden', 'Modelo não permitido no plano'],
                ['404', 'not_found', 'Modelo inexistente'],
                ['429', 'rate_limited', 'Rate limit excedido'],
                ['502', 'upstream_error', 'Provider retornou erro'],
              ].map(([http, code, when]) => (
                <tr key={code} className="border-t border-fg-muted/10">
                  <td className="px-4 py-3 font-mono">{http}</td>
                  <td className="px-4 py-3 font-mono text-xs">{code}</td>
                  <td className="px-4 py-3 text-fg-muted">{when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* OpenCode */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">8. Integração com OpenCode</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Configure o OpenCode (ou qualquer cliente OpenAI-compatível) para usar
          o Consecom Routing:
        </p>
        <pre className={codeClass}>
{`# ~/.config/opencode/opencode.jsonc
{
  "provider": {
    "consecom": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Consecom Routing",
      "options": {
        "baseURL": "https://api.consecomrouting.com/v1",
        "apiKey": "sk_cr_live_xxx"
      },
      "models": {
        "claude-sonnet-4-5": {},
        "claude-haiku-4-5": {}
      }
    }
  }
}`}
        </pre>
      </section>

      {/* Limites */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">9. Limites</h2>
        <ul className="mt-4 list-disc space-y-1 pl-6 text-sm text-fg-muted">
          <li>Rate limit: 10 req/min no plano TESTE (configurável por plano).</li>
          <li>Tokens por request: até 200k (contexto do modelo).</li>
          <li>Streaming: suportado em todos os modelos ativos.</li>
          <li>Tools / function calling: suportado.</li>
          <li>Vision: imagens base64 suportadas.</li>
        </ul>
      </section>

      <footer className="mt-16 border-t border-fg-muted/10 pt-8 text-xs text-fg-muted">
        Em caso de dúvidas, abra um ticket em{' '}
        <a href="mailto:suporte@consecom.local" className="text-accent">
          suporte@consecom.local
        </a>
        .
      </footer>
    </main>
  );
}