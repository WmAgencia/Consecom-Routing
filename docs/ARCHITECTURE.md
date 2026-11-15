# Arquitetura

```text
Landing ──> Checkout ──> Stripe
   │            │
   └──> Portal ─┴──> Postgres
                       │
Claude Code ──> API pública ──> LiteLLM ──> modelos configurados
                       │             │
                       │             └──> Redis
                       └──> monitor de franquia
```

## Fronteiras

- A landing contém somente conteúdo público.
- Portal, checkout e painel usam sessões assinadas e banco compartilhado.
- As APIs públicas encaminham requisições autenticadas para o LiteLLM.
- O LiteLLM é acessado internamente pelos serviços e possui uma interface administrativa separada.
- Postgres e Redis não possuem domínio público.
- Segredos não fazem parte do código-fonte.

## Persistência

O Postgres usa o volume `postgres-volume` em `/var/lib/postgresql/data`.

O Redis possui o volume `redis-volume` em `/data`. A configuração atual o utiliza como cache sem snapshots ou AOF.

## Região

Todos os serviços atuais executam uma réplica na região Railway `iad`.

