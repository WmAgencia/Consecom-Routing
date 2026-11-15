# Variáveis de ambiente

Valores reais pertencem à Railway. Este documento registra apenas nomes, finalidade e escopo.

| Variável | Serviços | Finalidade |
| --- | --- | --- |
| `DATABASE_URL` | Portal, checkout, painel, monitor, LiteLLM | Conexão privada com Postgres |
| `LITELLM_URL` | APIs, portal, checkout, painel, monitor | Endpoint privado do LiteLLM |
| `LITELLM_MASTER_KEY` | APIs e serviços administrativos | Administração do LiteLLM |
| `SESSION_SECRET` | Portal, checkout e painel | Assinatura de sessões e proteção de dados |
| `PUBLIC_API_URL` | Portal e painel | URL pública apresentada ao usuário |
| `PUBLIC_ORIGIN` | Portal e painel | Origem HTTPS canônica |
| `STRIPE_SECRET_KEY` | Checkout | Criação de pagamentos |
| `STRIPE_WEBHOOK_SECRET` | Checkout | Verificação de eventos de pagamento |
| `ADMIN_EMAIL` | Painel | Identidade inicial do administrador |
| `ADMIN_PASSWORD_HASH` | Painel | Hash da senha inicial |
| `LITELLM_SALT_KEY` | LiteLLM | Criptografia interna |
| `LITELLM_CONFIG_YAML` | LiteLLM | Catálogo e roteamento selados |
| `REDIS_URL` | LiteLLM | Cache privado |
| `REDIS_PASSWORD` | Redis e LiteLLM | Autenticação do cache |
| `PORT` | Serviços HTTP | Porta fornecida pela Railway |

## Regras

- Produção e desenvolvimento devem usar segredos diferentes.
- `SESSION_SECRET`, chaves administrativas e segredos de pagamento devem ser aleatórios e exclusivos.
- Variáveis seladas não devem ser recriadas apenas porque seu valor não pode ser lido.
- A troca de um segredo deve considerar sessões, webhooks e clientes que dependam dele.

