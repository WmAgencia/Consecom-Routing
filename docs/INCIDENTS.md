# Resposta a incidentes

## Prioridades

- **P0:** exposição de credencial, cobrança indevida ou acesso não autorizado.
- **P1:** API, login ou checkout indisponível.
- **P2:** degradação parcial, modelo específico indisponível ou métricas atrasadas.
- **P3:** problema visual ou administrativo sem impacto direto no cliente.

## Procedimento

1. Registrar horário, serviço e sintomas.
2. Conter o impacto sem apagar evidências.
3. Revogar credenciais expostas imediatamente.
4. Preservar logs relevantes e identificar o primeiro evento.
5. Corrigir em branch, validar e implantar conscientemente.
6. Confirmar recuperação pelos endpoints públicos e métricas.
7. Documentar causa, alcance e prevenção.

## Recuperação

Rollback de código não substitui restauração de dados. Alterações em schema, pedidos, chaves e franquias exigem verificação específica no Postgres e no LiteLLM.

