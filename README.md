# Consecom AI

Repositório oficial da plataforma Consecom AI em produção na Railway.

A Consecom AI oferece uma API compatível com as ferramentas do Claude Code, tanto no Desktop quanto na CLI. Os nomes e perfis de modelos apresentados ao cliente fazem parte da experiência Consecom e são mantidos estáveis para evitar mudanças na configuração dos usuários.

## Serviços

| Diretório | Função |
| --- | --- |
| `services/consecom-landing-v3` | Site público e planos |
| `services/consecom-ai-portal` | Login, painel administrativo e área do cliente |
| `services/consecom-checkout` | Cadastro, pagamento e entrega de chave |
| `services/consecom-branded-api` | Endpoint público principal da API |
| `services/consecom-smart-api` | Endpoint compatível legado |
| `services/consecom-proxy-dashboard` | Administração técnica do proxy |
| `services/consecom-token-quota-monitor` | Monitor de franquias executado por cron |
| `services/consecom-checkout-e2e-temporary` | Diagnóstico temporário do checkout |
| `infra/litellm` | Proxy e roteamento de modelos |
| `infra/postgres` | Banco de dados persistente |
| `infra/redis` | Cache privado |

## Desenvolvimento

Cada serviço Bun possui seu próprio `package.json`, `Dockerfile` e configuração Railway. Para iniciar um serviço:

```bash
cd services/consecom-ai-portal
bun run index.tsx
```

Copie `.env.example` para um arquivo local não versionado e preencha somente os valores necessários. Nunca envie credenciais ao Git.

## Implantação

Consulte [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). O estado documentado em [docs/RAILWAY.md](docs/RAILWAY.md) foi extraído do ambiente de produção em 15 de novembro de 2026.

## Comunicação do produto

Textos públicos devem explicar o benefício para usuários do Claude Code. Detalhes de fornecedores, rotas internas e infraestrutura ficam fora da comunicação comercial. Consulte [docs/BRANDING.md](docs/BRANDING.md).

