# Consecom AI — experiência comercial V2

## Identidade visual

A landing page comercial foi redesenhada a partir da base Next.js do repositório Consecom-Routing. O padrão utiliza superfícies claras e quentes, verde-carvão, acento terracota, cartões com bordas finas, animações discretas, tipografia de alta hierarquia, layouts responsivos e contraste acessível.

## Nova oferta comercial

| Pacote | Preço | Limite de custo da API |
| --- | ---: | ---: |
| Teste — 10 milhões | R$ 9,99 | US$ 0,10 |
| 50 milhões | R$ 29,99 | US$ 0,50 |
| 100 milhões | R$ 52,99 | US$ 1,00 |
| 250 milhões | R$ 109,99 | US$ 2,50 |
| 500 milhões | R$ 184,99 | US$ 5,00 |
| 750 milhões | R$ 249,99 | US$ 7,50 |
| 1 bilhão | R$ 199,99 | US$ 10,00 |

A franquia é controlada por **saldo financeiro da API**, não por um número fixo de tokens físicos. Modelos mais caros gastam o saldo mais depressa; tokens físicos, cache, entrada, saída e raciocínio permanecem disponíveis no histórico de utilização. O pacote de teste é limitado a uma ativação por usuário.

**Importante:** estes nomes e preços são equivalências comerciais, não promessas de entrega de uma quantidade fixa de tokens físicos. A comunicação deve explicar que a duração do saldo varia conforme o modelo.

## Ambiente ativo

- Landing page: https://consecom-ai-portal-production.up.railway.app/
- Administração: https://consecom-ai-portal-production.up.railway.app/admin
- Área do cliente: https://consecom-ai-portal-production.up.railway.app/cliente
- Gateway público: https://api-consecom.up.railway.app

## Arquitetura e migração

Este repositório contém uma implementação legada que utiliza planos por duração, saldos de créditos e uma base de dados própria. **Não substituir o gateway nem a base de dados em produção com os serviços legados deste repositório sem uma migração explícita e testes completos.**

O atual portal de produção utiliza autenticação própria, consultas ao Postgres compartilhado do LiteLLM, provisionamento seguro de chaves e limites financeiros. As páginas Next.js desta branch permitem evoluir o marketing em código versionado; a migração posterior dos painéis deve utilizar APIs compatíveis com o portal atual, protegendo autenticação e isolamento de dados.

## Marca do provedor

Os nomes internos de provedores de inferência não são apresentados na experiência comercial. O sistema não deve afirmar que os modelos servidos são acessos oficiais da Anthropic, nem insinuar que o serviço de API compatível é uma assinatura oficial do Claude Code. A configuração interna de roteamento permanece intacta.

## Pendências antes de comercializar automaticamente

- Integração de checkout e webhooks Stripe.
- Prevenção de estouro de saldo por chamadas simultâneas, inclusive streams longos.
- Renovação/recarga, emissão de chave e comprovação de pagamento.
- Verificação responsiva e acessibilidade no navegador.
- Política de uso, suporte e informações contratuais.
