# Operação

## Verificação diária

- Confirmar que todos os serviços possuem uma réplica ativa.
- Verificar o último resultado do monitor de franquias.
- Procurar respostas 5xx nas APIs, portal e checkout.
- Acompanhar memória do LiteLLM e espaço do Postgres.

## Verificação semanal

- Testar login administrativo e de cliente.
- Testar listagem de modelos com uma chave de teste.
- Confirmar bloqueio de chave ao atingir a franquia.
- Conferir backups e capacidade de restauração do Postgres.
- Revisar alertas de dependências e segurança do GitHub.

Imagens de produção são fixadas e atualizadas manualmente somente depois de validação em ambiente separado; o Dependabot atualiza apenas GitHub Actions.

## Antes de habilitar pagamentos

1. Configurar as duas variáveis da Stripe.
2. Confirmar `checkoutReady: true` e `mode: "test"` em `/healthz` durante a validação; em produção, `mode: "live"`.
3. Cadastrar o webhook apontando para `/webhooks/stripe`.
4. Executar compra de ponta a ponta no modo de teste.
5. Confirmar que a chave é revelada uma única vez.
6. Confirmar que o pedido, o usuário e a franquia aparecem no painel.

## Logs

Não registrar chaves, cookies, segredos, senhas, prompts completos ou respostas de clientes. Erros públicos devem permanecer genéricos; detalhes técnicos ficam nos logs internos sem dados sensíveis.

