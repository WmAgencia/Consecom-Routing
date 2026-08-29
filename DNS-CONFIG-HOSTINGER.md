# Configuração DNS — Hostinger (routing-consecom.com.br)

## ⚠️ Erro comum
```
DNS record validation error: RRset consecom.com.br IN ALIAS must not be used with A on the same name.
```

A Hostinger **proíbe** CNAME/ALIAS no apex (`@`) se já existe um **A-record** apontando pra algum IP. Solução: **remover todos os A-records e AAAA-records existentes em `@`** antes de adicionar o CNAME.

---

## Passo a passo no painel Hostinger

1. Login → `https://hpanel.hostinger.com/`
2. **Domínios** → clique em `routing-consecom.com.br` → **DNS / Zona DNS**
3. Na seção **Records**, procure todos os registros com **Nome = `@`** (ou vazio):
   - A `0.0.0.0` ou IP qualquer (geralmente parking)
   - AAAA `::` ou IPv6 (se houver)
4. **Apague esses A/AAAA records** um por um (ícone de lixeira)
5. Confirme a remoção
6. **Adicione os novos registros** (botão "Adicionar registro"):

### Domínio raiz (`@`) → Web (Next.js)

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| CNAME | `@` | `xqcc91xn.up.railway.app` | 3600 |
| TXT | `_railway-verify` | `railway-verify=dc2049d7c994fd9a631cbf14458e872e4a97b5efea60c16af7337641df993b04` | 3600 |

### Subdomínio `api` → API

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| CNAME | `api` | `bm9k3w1r.up.railway.app` | 3600 |
| TXT | `_railway-verify.api` | `railway-verify=068dcafc567a244e9d90c158af73b4ebb70ecc484b27a0c9af1a00a6fa53becf` | 3600 |

> O subdomínio `api` é independente — pode adicionar sem conflito, mesmo se o apex ainda não propagou.

---

## Após adicionar

1. Aguarde 5–30 min (TTL=3600)
2. Verifique no painel Railway (Dashboard → seu serviço → Settings → Domains):
   - Status muda de `CREATING` para `Verified` ✅
   - SSL provisionado automaticamente (Let's Encrypt, 1–5 min)
3. Teste:
   - `https://routing-consecom.com.br/` → landing Next.js
   - `https://api.routing-consecom.com.br/health` → `{"status":"ok"...}`

---

## Se ainda der erro de ALIAS

Se a Hostinger converter automaticamente o CNAME `@` em ALIAS, e ainda reclamar de conflito com A-record:
1. Verifique que **TODOS os A-records** foram removidos (mesmo IPv6 AAAA)
2. Aguarde a propagação dos deletes (pode levar 5 min)
3. Tente adicionar o CNAME novamente

Se persistir, abra ticket no suporte Hostinger dizendo:
> "Preciso adicionar um CNAME no apex do domínio `routing-consecom.com.br` apontando para `xqcc91xn.up.railway.app`. Há um A-record de parking impedindo. Solicito remoção completa dos registros A/AAAA no apex."

---

## Domínios que NÃO precisa mais

Depois que os custom domains funcionarem, pode deixar os antigos `*.up.railway.app` como fallback ou remover no painel Railway → Settings → Domains → Delete.