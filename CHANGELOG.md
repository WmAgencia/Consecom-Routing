# Changelog

Todas as alterações relevantes da plataforma devem ser registradas neste arquivo.

## Unreleased

### Adicionado

- Repositório oficial reconstruído a partir dos serviços atuais da Railway.
- Manifestos individuais de implantação.
- Validação de estrutura e detecção de credenciais.
- Migrações versionadas em `migrations/` aplicadas por `npm run migrate`, com trava explícita para `consecom_usage_accounted`.
- Documentação de arquitetura, operação, segurança e comunicação.

### Corrigido

- Revelação única da chave após pagamento.
- Metadados de limite total de tokens.
- Redirecionamentos públicos para HTTPS.
- Diagnóstico do checkout atualizado para as rotas atuais.

