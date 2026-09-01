# API do BuscaZapp

Essa API foi feita pra ser usada tanto pelo site (Next.js) quanto, mais pra
frente, pelos apps Android e iOS — por isso a autenticação é por **token**
(JWT), não por cookie de navegador. Qualquer cliente HTTP (fetch no
navegador, OkHttp no Android, URLSession no iOS) funciona do mesmo jeito.

Base URL: `https://SEU-DOMINIO/api` (localmente, `http://localhost:3000/api`).

## Formato de resposta

Toda resposta vem nesse formato:

```json
// sucesso
{ "success": true, "data": { ... } }

// erro
{ "success": false, "error": { "message": "...", "code": "..." } }
```

Campos monetários (preços, cashback etc.) são do tipo `Decimal` do Prisma e
chegam no JSON como **string** (ex: `"49.90"`), não como número — isso evita
perda de precisão. Converta com `parseFloat()`/`Number()` no cliente antes
de fazer contas.

## Autenticação

1. Chame `POST /api/auth/register` ou `POST /api/auth/login`.
2. Guarde o `token` que volta na resposta (no app: em armazenamento seguro —
   Keychain no iOS, EncryptedSharedPreferences/DataStore no Android; no
   site: onde preferir, ex. localStorage).
3. Em toda chamada que precisar de login, mande o header:
   `Authorization: Bearer SEU_TOKEN`.

O token expira em 30 dias. Não existe endpoint de refresh ainda — quando
expirar, o usuário loga de novo.

---

## Autenticação

### `POST /api/auth/register`
Cria uma conta nova.

```json
// body
{ "nome": "Maria", "email": "maria@email.com", "senha": "123456", "role": "consumidor" }
```
`role` é `"consumidor"` ou `"empresa"` (padrão: `"consumidor"`). Contas
`"empresa"` nascem sem empresa vinculada — depois usam `POST /api/claims`
pra reivindicar um perfil já existente.

Resposta: `{ token, user }`.

### `POST /api/auth/login`
```json
{ "email": "maria@email.com", "senha": "123456" }
```
Resposta: `{ token, user }`.

### `GET /api/auth/me` 🔒
Dados do usuário logado (qualquer papel).

---

## Categorias

### `GET /api/categories`
Lista todas as categorias ativas, com contagem de empresas.

### `GET /api/categories/[slug]`
Detalhe de 1 categoria + lista de empresas dela.

---

## Empresas

### `GET /api/companies`
Busca paginada. Query params (todos opcionais):

| Param | Tipo | Descrição |
|---|---|---|
| `q` | string | busca por nome, descrição ou categoria |
| `cidade` | string | filtra por cidade exata |
| `categoria` | string | slug da categoria |
| `avaliacaoMinima` | number | ex `4` = 4.0+ |
| `ordenarPor` | `relevancia`\|`avaliadas`\|`destaque` | ordenação |
| `page` | number | padrão 1 |
| `pageSize` | number | padrão 9, máx 50 |

Resposta: `{ page, pageSize, total, totalPages, empresas: [...] }`.

> Nota: o site hoje também ordena por "mais próximas" usando a localização
> do navegador (Haversine no cliente) — isso continua podendo ser feito no
> app também, calculando a distância localmente a partir de `latitude`/
> `longitude` que cada empresa já traz na resposta.

### `GET /api/companies/[slug]`
Detalhe completo: endereço, horários, galeria, produtos, serviços,
promoções ativas, cupons ativos e avaliações.

### `GET /api/companies/[slug]/reviews`
Lista de avaliações da empresa.

### `POST /api/companies/[slug]/reviews` 🔒 (consumidor)
```json
{ "nota": 5, "comentario": "Muito bom!" }
```
Recalcula automaticamente a média e o total de avaliações da empresa.

---

## Cupons e promoções

### `GET /api/coupons?companyId=&clube=1`
Lista cupons ativos. `clube=1` filtra só os exclusivos do BuscaZapp Clube.

### `POST /api/coupons/[id]/redeem`
Marca 1 uso do cupom (respeita o limite) e gera um lead pra empresa.
Funciona sem login (igual ao protótipo hoje), mas se vier `Authorization`,
o resgate fica associado ao usuário nos logs.

### `GET /api/promotions?companyId=`
Lista promoções ativas.

---

## Favoritos 🔒

- `GET /api/favorites` — lista as empresas favoritadas.
- `POST /api/favorites` — body `{ "companyId": "..." }`.
- `DELETE /api/favorites/[companyId]` — remove.

## Reivindicação de perfil 🔒

### `POST /api/claims`
```json
{ "companySlug": "pizzaria-titan", "metodo": "email" }
```
`metodo`: `"email" | "telefone" | "documento"`.

## Cashback 🔒

### `GET /api/cashback`
Resposta: `{ saldo, extrato: [...] }`.

## BuscaZapp Clube

### `GET /api/club/partners`
Lista as empresas parceiras do clube (sem precisar login).

---

## Painel da empresa 🔒 (role `empresa`)

Só funciona pra um usuário que já tem `companyId` vinculado (depois de uma
reivindicação aprovada).

- `GET /api/painel/company` — dados completos da própria empresa.
- `PATCH /api/painel/company` — atualiza `nomeFantasia`, `descricao`,
  `telefone`, `whatsapp`, `email`, `instagram` ou `site` (manda só os
  campos que quer mudar).
- `GET /api/painel/coupons` — cupons da própria empresa (todos os status).
- `POST /api/painel/coupons` — cria cupom novo: `{ titulo, descricao,
  codigo, desconto, validade, limite? }`.

---

## O que ainda não existe (próximas etapas)

- Endpoints de admin (aprovar reivindicação, mudar status de empresa etc.).
- Upload de imagem de verdade (hoje `logoUrl`/`capaUrl`/galeria continuam
  sendo só texto — precisa de um endpoint de upload + storage externo,
  tipo Cloudflare R2/S3, já que a Hostinger compartilhada não é boa pra
  isso).
- Mais telas do painel (produtos, serviços, promoções, estatísticas) ainda
  não têm rota própria — seguem o mesmo padrão de `/api/painel/coupons`
  quando forem migradas.
- Recuperação de senha ("esqueci minha senha").
- Refresh token / logout no servidor (hoje o token só expira sozinho).

## Rodando localmente

```bash
cp .env.example .env
# preencha DATABASE_URL (MySQL) e JWT_SECRET no .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Teste rápido com curl:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.eduarda@email.com","senha":"123456"}'
```
