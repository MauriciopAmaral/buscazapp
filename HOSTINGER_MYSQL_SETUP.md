# Guia passo a passo — Banco de dados MySQL na Hostinger

Este guia mostra como criar o banco de dados MySQL do BuscaZapp no hPanel da Hostinger e conectar o projeto Next.js a ele usando Prisma. Depois de seguir os passos, você terá o schema criado e os dados de exemplo (as mesmas 30 empresas, categorias, cupons etc.) carregados de verdade no banco.

---

## Parte 1 — Criar o banco de dados no hPanel

1. Acesse **hpanel.hostinger.com** e faça login.
2. No menu lateral, entre em **Bancos de Dados → Bancos de dados MySQL** (em alguns planos aparece como "Databases → MySQL Databases").
3. Clique em **Criar novo banco de dados**.
4. Preencha:
   - **Nome do banco de dados**: algo como `buscazapp` (a Hostinger vai prefixar automaticamente, ex: `u123456789_buscazapp`).
   - **Nome de usuário**: ex: `buscazapp_user` (também recebe o prefixo, ex: `u123456789_buscazapp`).
   - **Senha**: crie uma senha forte e **guarde em um lugar seguro** (você vai precisar dela no `.env`).
5. Clique em **Criar**. Anote os três dados:
   - Nome do banco (ex: `u123456789_buscazapp`)
   - Usuário (ex: `u123456789_buscazapp`)
   - Senha

---

## Parte 2 — Liberar acesso remoto ao banco

Por padrão, o MySQL da Hostinger só aceita conexões de dentro do próprio servidor. Como o Next.js vai rodar em outro lugar (seu computador agora, e depois provavelmente na Vercel), você precisa liberar o acesso remoto.

1. Ainda em **Bancos de Dados MySQL**, procure a seção **Acesso remoto MySQL** (ou **Remote MySQL**).
2. Clique em **Adicionar novo host de acesso remoto**.
3. Para testar do seu computador agora, adicione:
   - `%` (libera de qualquer IP — **use só para testar**, depois troque pelo IP fixo do seu servidor de produção por segurança)
   - ou o IP da sua conexão atual, que a própria Hostinger sugere automaticamente.
4. Salve.

> **Importante sobre segurança**: deixar `%` liberado funciona para desenvolvimento, mas depois que o site estiver em produção (ex: na Vercel), o ideal é restringir para os IPs dos servidores da Vercel — como a Vercel usa IPs dinâmicos, muita gente nesse caso usa um serviço de proxy (como o **Prisma Accelerate** ou um túnel) ou migra o banco para um provedor com IP fixo/whitelisting mais flexível. Podemos ajustar isso quando chegar a hora do deploy — por enquanto, com `%` liberado, você já consegue desenvolver localmente.

5. Anote também o **host do banco** — normalmente algo como `srv123.hstgr.io` ou o IP do servidor. Ele aparece na mesma tela de Bancos de Dados MySQL, em "Detalhes de acesso" ou similar. A porta padrão é `3306`.

---

## Parte 3 — Configurar o projeto

O projeto já vem com o **Prisma** instalado e o **schema do banco** pronto em `prisma/schema.prisma` (ele espelha exatamente os tipos que já existem no frontend: Company, Category, Coupon, Promotion, Review, Subscription, etc.).

1. Na pasta do projeto, copie o arquivo de exemplo de variáveis de ambiente:

   **Windows (cmd):**
   ```bash
   copy .env.example .env
   ```

   **Mac/Linux:**
   ```bash
   cp .env.example .env
   ```

2. Abra o `.env` e preencha a linha `DATABASE_URL` com os dados que você anotou:

   ```
   DATABASE_URL="mysql://USUARIO:SENHA@HOST:3306/NOME_DO_BANCO"
   ```

   Exemplo real (com dados fictícios):

   ```
   DATABASE_URL="mysql://u123456789_buscazapp:MinhaSenh@123@srv123.hstgr.io:3306/u123456789_buscazapp"
   ```

   ⚠️ Se sua senha tiver caracteres especiais (`@`, `#`, `%`, `/`, etc.), eles precisam ser codificados na URL. Por exemplo, `@` vira `%40`. Se preferir, me manda a senha (ou só me avisa que ela tem caractere especial) que eu te ajudo a montar a string certinha.

---

## Parte 4 — Criar as tabelas no banco (migration)

Com o `.env` preenchido, rode no terminal, dentro da pasta do projeto:

```bash
npm install
npx prisma db push
```

Isso vai:
- Conectar no banco da Hostinger
- Criar todas as tabelas (empresas, categorias, cupons, promoções, avaliações, usuários, assinaturas, leads, reivindicações, anúncios, etc.)
- Gerar o cliente Prisma tipado para o TypeScript

> **Por que `db push` e não `migrate dev`?** O comando `migrate dev` tenta criar um banco temporário extra ("shadow database") para comparar versões do schema — e hospedagem compartilhada normalmente não deixa o usuário criar bancos novos, só usar o que já foi criado no hPanel. O `db push` aplica o schema direto, sem precisar desse banco temporário. Ele não gera histórico de migrations versionado (bom pra quem tem controle total do servidor), mas para este momento — criar as tabelas e começar a desenvolver — funciona igual.

Se aparecer algum erro de conexão aqui, geralmente é um destes três motivos:
- O acesso remoto (Parte 2) não foi salvo corretamente — confira no hPanel.
- A `DATABASE_URL` tem algum caractere errado ou a senha não foi escapada.
- Seu provedor de internet/rede está bloqueando a porta 3306 — nesse caso, tente de outra rede (ex: hotspot do celular) para confirmar.

---

## Parte 5 — Popular o banco com os dados de exemplo

O projeto já tem um script de seed (`prisma/seed.ts`) que pega os mesmos dados fictícios que já estão em `src/mocks` (as 30 empresas do Pará, categorias, cupons, promoções, avaliações etc.) e insere tudo no banco real. Assim você não perde nada do que já foi validado visualmente.

```bash
npm run db:seed
```

Ao final, você terá no banco:
- 30 empresas com endereço, horários, galeria
- 15 categorias
- Produtos e serviços de cada empresa reivindicada
- 10 promoções e 10 cupons
- 20 avaliações
- Usuários de teste (consumidor, empresa, admin) — **senha padrão: `123456`**
- Assinaturas, pagamentos, leads, analytics diário, reivindicações, prospecção e anúncios

---

## Parte 6 — Conferir se deu tudo certo

Você pode abrir uma interface visual do banco direto do terminal:

```bash
npm run db:studio
```

Isso abre o **Prisma Studio** no navegador (`http://localhost:5555`), onde dá pra navegar em todas as tabelas e ver os dados inseridos, bem parecido com um phpMyAdmin.

---

## Atualização: geolocalização

O schema ganhou dois campos novos em `Company` (`latitude` e `longitude`), usados para calcular distância real até quem está buscando, e mostrar mapa/rota na página da empresa. Se você já tinha rodado `npx prisma db push` e `npm run db:seed` antes desta atualização, rode os dois de novo (nessa ordem) para aplicar as novas colunas e repopular com as coordenadas:

```bash
npx prisma db push
npm run db:seed
```

Isso não apaga o que já existia — só ajusta a estrutura e atualiza os dados de exemplo.

---

## Atualização: BuscaZapp Clube e Cashback

O schema ganhou os campos `clubeParceiro` e `cashbackPercentual` em `Company`, `exclusivoClube` em `Coupon`, `clubeAssinante` em `User`, e uma tabela nova `CashbackTransaction` (extrato de cashback por usuário/empresa). Se o banco já estava rodando antes desta atualização, rode de novo:

```bash
npx prisma db push
npm run db:seed
```

---

## Atualização: importação do banco antigo (Neon/Postgres)

O dump `buscazapbackup20260823.dump` que você mandou foi analisado e trazido pro projeto — só que era um banco vazio, com apenas 1 conta de demonstração (`Demo Prestador`) e 6 anúncios de exemplo (fora do Pará: São Paulo, Rio, BH, Curitiba, Brasília e Salvador). Não havia empresas reais, assinaturas nem pagamentos naquele banco. Ainda assim, deixei os 6 registros já dentro do projeto (`src/mocks/legacyCompanies.ts`) e no `prisma/seed.ts`, com a senha original preservada (hash bcrypt), pra você/o cliente atualizar depois pelo painel.

⚠️ **Antes de rodar o seed de novo, confirme uma coisa importante**: se você **já rodou `npm run db:seed` alguma vez antes** (mesmo que só uma vez), rodar de novo vai duplicar linhas em algumas tabelas (produtos, promoções, cupons, avaliações, leads, anúncios) porque elas não têm proteção contra duplicidade — só empresas, categorias, cidades e usuários são seguros pra rodar de novo. Se as tabelas ainda estavam com 0 linhas na última vez que você olhou o phpMyAdmin, pode rodar `npm run db:seed` numa boa. Se já tinha dado certo antes, me avisa antes de rodar de novo que eu ajusto o script pra ser seguro repetir.

```bash
npx prisma db push
npm run db:seed
```

---

## Atualização: API real + autenticação (JWT)

O backend "de verdade" começou: agora existe uma API completa em `src/app/api/*` (autenticação, empresas, categorias, cupons, promoções, avaliações, favoritos, reivindicação de perfil, cashback, clube e um início do painel da empresa) — tudo documentado em `API.md`. A autenticação é por token (JWT) em vez de cookie de sessão, de propósito: assim o mesmo backend serve o site e, mais pra frente, os apps Android/iOS.

Pra isso funcionar você precisa adicionar mais uma variável no `.env`:

```
JWT_SECRET="uma-string-aleatoria-bem-longa-aqui"
```

(gere uma com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

Como a API usa o Prisma Client de verdade (não só o schema), depois de configurar o `.env` rode:

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

E teste com o passo a passo em `API.md`.

**Importante**: o site (as telas que você já usa) ainda está rodando com os dados mockados em `src/mocks/*` — a API já existe e já funciona, mas as telas ainda não foram trocadas pra consumir ela. Essa troca (página por página, usando os arquivos em `src/services/*.ts` como ponte) é o próximo passo.

## Atualização: site conectado no banco de verdade

As telas principais do site pararam de usar `src/mocks/*` e passaram a buscar direto no banco:

- **Páginas de servidor** (`/`, `/categorias`, `/categoria/[slug]`, `/empresa/[slug]`, `/cupons`) buscam direto no Prisma através de `src/lib/companyData.ts` e `src/lib/categoryData.ts` — sem passar pela API, já que rodam no mesmo servidor.
- **Páginas com filtro interativo** (`/buscar`, `/ofertas`, `/favoritos`, `/clube`, `/cashback`) chamam a API (`/api/companies`, `/api/categories`, `/api/promotions`, `/api/coupons`, `/api/club/partners`, `/api/cashback`) direto do navegador.
- **Painel da empresa**: só as telas de **Minha empresa** (dados gerais + contato) e **Cupons** já leem/gravam no banco de verdade (`/api/painel/company`, `/api/painel/coupons`). Categoria, endereço e horário de funcionamento da empresa ainda aparecem mas não têm endpoint pra salvar ainda.

O que **continua** usando dados fictícios (`src/mocks/*`), porque a API correspondente ainda não existe:

- Painel da empresa: produtos, serviços, promoções, estatísticas, financeiro, assinatura, avaliações, leads, fotos, configurações.
- Todo o **painel de admin** (`/admin/*`) — usuários, cidades/bairros/estados, categorias, cupons, promoções, planos, financeiro, relatórios, prospecção, reivindicações, anúncios.
- O assistente de "Reivindicar perfil" continua simulando o envio de código (não existe backend de SMS/e-mail ainda).
- Os selos de "com oferta"/"com cupom" nos cartões de empresa (`CompanyCard`) ainda comparam com os cupons/promoções fictícios — podem aparecer errados pra empresas reais até isso ser ajustado também.

## Atualização: painel da empresa completo + aprovação de reivindicações

Mais uma leva de telas passou a usar o banco de verdade:

- **Painel da empresa**: Produtos, Serviços, Promoções (com pausar/reativar), Avaliações (responder), Leads e Estatísticas — tudo com CRUD real via `/api/painel/*`.
- **Reivindicar perfil** (`/reivindicar/[slug]`): a etapa de "criar conta" agora cria mesmo a conta (via `/api/auth/register`), e a etapa final grava a reivindicação de verdade (via `POST /api/claims`) — só a validação em si (código por e-mail/SMS/documento) continua simulada, porque não existe serviço de envio configurado ainda.
- **Admin → Reivindicações**: lista as reivindicações reais e aprova/rejeita de verdade (`/api/admin/claims`). Aprovar já faz duas coisas automaticamente: marca a empresa como reivindicada e vincula a conta do usuário como dona dela (`User.companyId`) — é isso que faz o painel da empresa dela passar a mostrar os dados certos.
- **Admin → Empresas**: lista todas as empresas reais do banco (`/api/admin/companies`).
- **Proteção de rota**: `/painel/*` agora exige estar logado como `empresa`, e `/admin/*` exige estar logado como `admin` — quem não estiver logado (ou for do papel errado) é redirecionado automaticamente.

O que **continua** com dados fictícios, porque a API correspondente ainda não existe:

- Painel da empresa: Fotos, Assinatura, Financeiro, Configurações, Impulsionar (o "Impulsionar" tem tela pronta mas não processa pagamento de verdade).
- Todo o resto do admin: usuários, cidades/bairros/estados, categorias, cupons, promoções, planos, financeiro, relatórios, prospecção, anúncios, empresas não reivindicadas.
- Upload de imagem de verdade (logo/capa/galeria/fotos de produto continuam sendo só texto de URL).

## Atualização: login sem atalhos de dev + recuperação de senha + admin (Usuários e Categorias) real

- **Tela de login**: removi o bloco "Atalhos de desenvolvimento" (os botões de "Entrar como consumidor/empresa/administrador") — a partir de agora só dá pra entrar com e-mail e senha de verdade, como num site em produção.
- **Esqueci minha senha**: novo fluxo completo em `/recuperar-senha` → `/redefinir-senha/[token]`. **Importante**: como ainda não existe um serviço de e-mail configurado no projeto (precisaria de uma conta em algo como Resend ou SendGrid + uma chave de API — mesma situação do código de verificação da tela de "Reivindicar perfil"), o link de redefinição não é enviado por e-mail ainda: ele aparece direto na tela depois de informar o e-mail. Se quiser que isso vire um e-mail de verdade, me passa as credenciais de um serviço de e-mail (Resend é o mais simples de configurar) que eu termino de ligar.
  - **Isso exige rodar uma migração no banco** (`npx prisma db push`) antes do próximo deploy — adicionei uma tabela nova (`PasswordResetToken`) no schema. Rode isso a partir da sua máquina, com o `.env` apontando pro banco de produção da Hostinger, igual você já fez pras tabelas anteriores.
- **Admin → Usuários**: agora lista as contas reais do banco, com busca por nome/e-mail, e permite trocar o papel da conta (consumidor/empresa/admin) ou desvincular uma empresa da conta — direto na tabela, sem precisar editar o banco na mão.
- **Admin → Categorias**: CRUD completo de verdade (criar, editar nome/ícone/descrição, ativar/desativar) via `/api/admin/categories`.

## Atualização: segmento (categoria) editável + busca corrigida pra empresas novas

Duas correções relacionadas ao cadastro de empresa nova:

- **Segmento que não está na lista**: tanto no cadastro (`/painel/criar-empresa`) quanto depois, editando em **Minha empresa**, agora tem a opção "Não achei o meu — cadastrar um novo" no campo Segmento. Ao escolher essa opção e digitar um nome (ex: "Gráfica"), uma `Category` nova é criada no banco na hora e já fica disponível pra próximas empresas escolherem também.
- **Empresa nova não aparecia em `/buscar`**: o filtro de cidade comparava o texto digitado no cadastro com o texto da busca de forma exata (`===`), incluindo acento e maiúscula/minúscula — então "Belém" (com acento, vindo do cadastro) podia não bater com "belem" ou variações digitadas na busca. Isso foi corrigido pra comparar ignorando acento, maiúscula/minúscula e espaços extras, tanto em `/buscar` quanto em `/admin/empresas`.

## Atualização: upload de fotos usando a própria hospedagem Hostinger

Em vez de contratar um serviço externo (Cloudflare R2, S3, Uploadthing etc.), o upload de imagens agora usa **a mesma hospedagem Hostinger que já hospeda o banco**, via FTP. Quando a empresa envia uma foto (logo, capa, galeria — e no futuro produtos/serviços), o servidor da Vercel conecta na sua hospedagem por FTP, salva o arquivo numa pasta organizada por empresa e grava só o **caminho/URL** no banco. Quando alguém visita o site, a imagem é servida direto do seu domínio Hostinger (`https://seudominio.com.br/uploads/...`), sem precisar de nenhum serviço pago.

**O que foi feito no código:**

- `src/lib/ftpUpload.ts` — conecta na hospedagem via FTP/FTPS (biblioteca `basic-ftp`) e sobe/apaga arquivos.
- `POST /api/painel/upload` — recebe o arquivo (jpg/png/webp, até 4MB), organiza em `uploads/empresas/{id-da-empresa}/{pasta}/...` e devolve a URL pública.
- `GET`/`POST /api/painel/gallery` e `DELETE /api/painel/gallery/[id]` — CRUD da galeria de fotos da empresa.
- `PATCH /api/painel/company` — agora também aceita `logoUrl` e `capaUrl`.
- Tela **Painel → Fotos** (`/painel/fotos`) passou a ser real: trocar logo, trocar capa e gerenciar a galeria de fotos, tudo enviando pro seu Hostinger e salvando no banco.

**O que falta você fazer (preciso disso pra ativar):**

1. **Criar (ou reaproveitar) uma pasta pública pra uploads no seu Hostinger.** No hPanel, dentro do `public_html` do domínio, crie uma pasta chamada `uploads` (ou o nome que preferir) — ela precisa ficar acessível por HTTPS, então algo como `public_html/uploads`.
2. **Criar uma conta FTP com acesso a essa pasta.** No hPanel, vá em **Arquivos → Contas FTP**, crie uma nova conta (pode ser restrita só à pasta `uploads`, por segurança) e anote: host FTP (geralmente aparece na própria tela, algo como `ftp.seudominio.com.br` ou o IP do servidor), usuário e senha.
3. **Me passar (ou preencher direto no `.env` e nas variáveis da Vercel) esses 4 valores:**
   - `FTP_HOST` — o host FTP anotado no passo 2.
   - `FTP_USER` — o usuário FTP.
   - `FTP_PASSWORD` — a senha FTP.
   - `UPLOADS_PUBLIC_URL` — a URL pública da mesma pasta, por exemplo `https://seudominio.com.br/uploads`.
   - (Opcional) `FTP_BASE_PATH` — só se a pasta dentro da conta FTP não for `/public_html/uploads` (por exemplo, se a conta FTP já "cai" direto dentro da pasta `uploads`, o caminho pode ser só `/`).
4. **Adicionar essas mesmas variáveis na Vercel** (Project Settings → Environment Variables) — sem isso o upload funciona local mas falha em produção. Depois de adicionar, é preciso fazer um novo deploy (ou "Redeploy") pra elas passarem a valer.

Enquanto essas variáveis não estiverem configuradas, o botão de upload mostra erro ao tentar enviar — o resto do site continua funcionando normalmente.

**Erro comum: "Hostname/IP does not match certificate's altnames"** — acontece quando `FTP_HOST` é o IP do servidor (em vez de um nome de domínio) e a conexão usa FTPS (padrão). O certificado TLS que a Hostinger apresenta foi emitido pro domínio do servidor, não pro IP, então a verificação de certificado falha. A correção já está no código: por padrão a verificação estrita fica desligada (variável `FTP_TLS_REJECT_UNAUTHORIZED="false"`, que é o padrão mesmo se você não definir nada). Se ainda assim quiser validação total do certificado, use o hostname do servidor FTP (não o IP) em `FTP_HOST`.

## Atualização: importação em massa de categorias, estados/cidades (Brasil todo) e bairros

Nova página **Admin → Dados de referência** (`/admin/dados-de-referencia`), com três botões — cada um pode ser clicado quantas vezes quiser, sem duplicar o que já existe no banco:

- **Importar categorias**: cria de uma vez ~55 segmentos de negócio comuns (Academias, Barbearias, Guinchos, Salões de Beleza, etc. — a mesma lista que você mandou print). Categorias que já existirem (ex: as que você já cadastrou manualmente, ou "Gráfica" que já foi criada pelo fluxo de "adicionar segmento") não são duplicadas.
- **Importar cidades (todo o Brasil)**: busca os ~5.570 municípios oficiais direto na **API pública do IBGE** (não precisa de chave/cadastro) e grava todos no banco, um estado por vez — o botão mostra o progresso (estado a estado) e leva cerca de 1 minuto no total.
- **Importar bairros**: grava os bairros oficiais de **Belém** (73 bairros, conforme as Leis Municipais 7.806 e 8.655) e **Castanhal** (28 bairros, Lei 029/2019), além de uma lista de **Ananindeua** (21 bairros) — essa última eu não achei uma lei municipal consolidada como fonte, então pode ter alguma divergência pontual; dá pra corrigir depois direto no banco se precisar. **Marabá e Santarém ficaram de fora** porque não encontrei uma lista oficial confiável pra essas duas — se você tiver a lista de bairros delas (ou de qualquer outra cidade), me manda que eu incluo.

**Ordem recomendada pra rodar**: Categorias → Cidades → Bairros (não é obrigatório, mas evita telas vazias enquanto os outros dados ainda não chegaram).

As telas **Admin → Estados**, **Admin → Cidades** e **Admin → Bairros** (que antes eram só mockup) agora mostram os dados reais do banco, com busca e paginação.

**Isso exige rodar `npx prisma db push` de novo antes do próximo deploy** — adicionei uma trava de duplicidade nova no schema (`@@unique` em `Neighborhood`, pra nome de bairro não duplicar dentro da mesma cidade quando a importação for rodada mais de uma vez). Se você já rodou o `db push` depois da atualização anterior (a do `PasswordResetToken`), rode de novo — é rápido e não apaga dados existentes.

Não precisa de nenhuma variável de ambiente nova nem chave de API pra essa parte — a API do IBGE é pública e gratuita.

## O que ainda falta (próxima etapa)

1. **Terminar o resto do admin** — as telas de planos, cupons/promoções em massa, financeiro, relatórios, prospecção e anúncios ainda precisam de endpoints próprios, seguindo o padrão de `/api/admin/claims` e `/api/admin/companies` (Usuários, Categorias e os dados de referência já foram feitos).
2. **Validação de verdade na reivindicação de perfil e no "esqueci minha senha"** (enviar código/link por e-mail/SMS real, em vez de mostrar na tela) — precisa de um serviço de envio (ex: Resend pra e-mail, alguma API de SMS) configurado com chave de API.

Me diz por qual desses quer que eu continue — ou me passa as credenciais de FTP do item acima que eu já deixo o upload de fotos funcionando em produção.
