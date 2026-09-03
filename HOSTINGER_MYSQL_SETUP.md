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

## Atualização: correção — páginas públicas ficavam "presas" na versão antiga

**Causa raiz do problema** de categorias novas (ou empresas novas) não aparecerem mesmo depois de já estarem no banco: as páginas públicas (Início, Todas as categorias, página de uma categoria, página de uma empresa, Cupons) são páginas renderizadas no servidor, e nenhuma delas tinha uma configuração dizendo "busque sempre dados atualizados". O Next.js, por padrão, gera o HTML dessas páginas na primeira visita depois de um deploy e **guarda essa versão em cache indefinidamente**, servindo ela pra todo mundo — mesmo que o banco mude depois (seja por uma importação, seja por um cadastro novo de empresa). Só um novo deploy "limpava" esse cache.

Corrigido adicionando `export const dynamic = "force-dynamic"` nessas 5 páginas (`/`, `/categorias`, `/categoria/[slug]`, `/empresa/[slug]`, `/cupons`), que faz elas buscarem direto no banco a cada visita, sem cache. A partir do próximo deploy, qualquer mudança no banco — seja pelas importações da tela de Dados de referência, seja por uma empresa se cadastrando, seja por você editando algo no admin — aparece pro visitante na hora, sem precisar esperar um novo deploy.

Não exige `db push` nem variável de ambiente nova — é só código.

## Atualização: todas as cidades do Brasil direto por SQL (`cidades_insert.sql`)

Igual fizemos com as categorias, vai junto na raiz do projeto o arquivo **`cidades_insert.sql`** com os **5.571 municípios do Brasil** (todos os 26 estados + DF), prontos pra inserir direto no banco pelo phpMyAdmin — sem precisar clicar no botão "Importar cidades" do admin (que também funciona, mas demora ~1 minuto fazendo uma chamada por estado; o SQL faz tudo de uma vez).

**Fonte dos dados**: dataset público [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros) no GitHub, amplamente usado pela comunidade de devs brasileira, com nome e UF de cada município — a mesma informação que viria da API do IBGE (código, nome, UF), só que já baixada e pronta, sem depender da API do IBGE responder na hora.

**Como usar**:

1. No hPanel, abra o **phpMyAdmin** do banco `u129712343_buscazapp`.
2. Vá na aba **Importar** (não "SQL" dessa vez — o arquivo é grande, ~273 KB, e a aba Importar lida melhor com arquivos grandes que colar direto na caixa de SQL).
3. Clique em **Escolher arquivo**, selecione o `cidades_insert.sql` (está na raiz do zip do projeto).
4. Clique em **Executar/Go**.

Vai levar alguns segundos. Como uso `INSERT IGNORE` e a tabela `City` tem uma trava de nome+estado repetido, as 5 cidades que você já tinha (Belém, Ananindeua, Castanhal, Marituba, Benevides) não duplicam — só entram as novas.

Depois é só conferir em **Admin → Cidades** e **Admin → Estados** — essas telas do admin já buscam sempre direto no banco (sem cache), então aparecem atualizadas assim que você atualizar a página, sem precisar de deploy novo.

## Atualização: Admin → Empresas com Editar, Ativar/Desativar e Excluir

A tela **Admin → Empresas** ganhou ações de verdade na coluna "Ações", pra cada empresa da lista:

- **Editar**: abre uma tela nova (`/admin/empresas/[id]`) com o cadastro completo da empresa — dados gerais, segmento (com a mesma opção de cadastrar um segmento novo), contato, endereço, e uma seção só de admin com **Status** (Ativo/Pendente/Suspenso), **Plano**, e os interruptores de Verificada / Destaque premium / Reivindicada. Salva tudo de uma vez.
- **Ativar/Desativar**: direto na lista, sem precisar abrir a tela de edição — alterna o status entre "ativo" e "suspenso" com uma confirmação. Uma empresa suspensa continua no banco mas para de aparecer nas buscas/listagens públicas (mesmo filtro que já existia pra `status: "ativo"` nas páginas do site).
- **Excluir**: apaga a empresa definitivamente, junto com tudo que depende dela (produtos, serviços, promoções, cupons, avaliações, fotos, analytics etc. — o banco já tinha essa trava de "apagar em cascata" pra essas tabelas). Contas de usuário vinculadas à empresa (o dono que fez login) não são apagadas, só desvinculadas — viram consumidor comum, sem empresa, e podem se cadastrar de novo depois se precisar. Pede confirmação antes, porque não dá pra desfazer.

Também dá pra excluir empresa direto de dentro da tela de edição (botão vermelho no rodapé do formulário).

Não exige `db push` nem variável de ambiente nova — só código novo (a rota `/api/admin/companies/[id]` com GET/PATCH/DELETE, e a página de edição).

## Atualização: Admin → Empresas não reivindicadas, real e com os ícones funcionando

Essa tela também era só mockup (lista fixa, nenhum ícone fazia nada de verdade). Agora:

- Lista as empresas reais do banco que ainda estão com `reivindicada: false` (cadastradas por você/admin mas sem um dono de conta vinculado ainda).
- **Ícone de olho (Visualizar)**: abre a página pública da empresa, igual antes — agora com o link certo pra empresa real.
- **Ícone de lápis (Editar)**: agora leva pra tela de edição completa que criamos em Admin → Empresas (`/admin/empresas/[id]`) — dá pra corrigir dados, mudar status, marcar como verificada etc. direto por lá também.
- **Ícone de escudo (Marcar como verificada)**: alterna `verificado` pra essa empresa de verdade no banco (clicar de novo desfaz). O escudo fica verde quando está verificada.
- **Ícone de alvo (Iniciar prospecção)**: cria um registro real de prospecção pra essa empresa (tabela `Prospect`, status inicial "novo") — é o primeiro passo pra ela aparecer no CRM de prospecção. Ao clicar, o ícone fica verde e desabilitado (já está no funil, não duplica).

**Importante**: a tela **Admin → Prospecção** (o quadro tipo Kanban com as colunas Novo/Contatado/Interessado etc.) ainda é só mockup — ela não lê os `Prospect` que essa tela cria. Ligar o Kanban de prospecção nos dados reais fica pra próxima etapa (está na lista "O que ainda falta" abaixo).

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Usuários com Editar e Excluir (e trocar senha manualmente)

A tela **Admin → Usuários** ganhou uma coluna de ações:

- **Editar** (lápis): abre um formulário pra mudar nome e e-mail da conta, e — o pedido principal — **definir uma nova senha pra ela na hora**, sem precisar do fluxo de "esqueci minha senha". Útil quando alguém perde acesso e ainda não configuramos envio de e-mail de verdade (a mesma limitação de sempre — ver a seção de "esqueci minha senha" mais acima). Senha nova precisa ter pelo menos 6 caracteres; deixando o campo em branco, a senha atual não muda.
- **Excluir** (lixeira): apaga a conta definitivamente, com confirmação antes. Reivindicações antigas feitas por essa conta (`Claim`) ficam sem usuário vinculado em vez de serem apagadas junto, pra manter o histórico. Se a conta tinha uma empresa vinculada, a empresa **não é apagada** — só fica sem esse usuário (o admin pode vincular outra conta a ela depois em Empresas, ou pela própria tela de Usuários usando "vincular empresa"). Por segurança, o próprio admin logado não consegue excluir a própria conta por essa tela (o botão fica desabilitado nela).

A troca de papel (Consumidor/Empresa/Admin) e o "desvincular empresa" que já existiam continuam do mesmo jeito.

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Categorias com Excluir

A tela **Admin → Categorias** (Editar e Ativar/Desativar já eram reais desde a atualização anterior) ganhou o ícone de **Excluir** (lixeira):

- Só é possível excluir uma categoria que **nenhuma empresa está usando** — se houver empresas naquele segmento, o botão mostra o motivo ao passar o mouse e a exclusão é bloqueada com uma mensagem clara (dizendo quantas empresas estão usando). Isso porque toda empresa precisa ter uma categoria, então excluir uma em uso quebraria o cadastro dela.
- Pra tirar uma categoria de circulação sem empresas nela, é só excluir. Se ela ainda tem empresas, a alternativa é **desativar** (o botão de toggle ao lado) — ela some dos filtros do site mas continua vinculada às empresas que já a usam.

Não exige `db push` nem variável de ambiente nova.

## Atualização: correção — editar categoria não salvava ao apagar o ícone, + busca e filtro de status

**Bug corrigido**: no formulário de editar categoria, se você apagasse o campo do ícone (emoji) e tentasse salvar, a alteração era ignorada silenciosamente — o código só salvava o ícone se sobrasse algum texto depois de "aparar espaços", então um campo vazio nunca chegava a ser gravado. Corrigido: agora qualquer valor do campo Ícone é salvo, incluindo vazio.

**Bug relacionado, mais sério, que também foi corrigido**: a tela de Admin → Categorias carregava a lista pela rota pública `/api/categories`, que só devolve categorias **ativas** — ou seja, depois de desativar uma categoria, ela sumia da própria tela do admin e não tinha como reativá-la por ali (só direto no banco). Criei uma rota só pro admin (`GET /api/admin/categories`) que traz todas, ativas e inativas, e troquei a tela pra usar ela.

**Novidades pedidas**: acima da lista agora tem uma **busca por nome** e um filtro de **Todas / Ativas / Inativas**, igual o padrão usado nas outras telas do admin (Empresas, Cidades etc.).

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Bairros com busca, cadastro manual e ligado a estado/cidade

A tela **Admin → Bairros** era só uma consulta (escolhia uma cidade dentre as que já tinham bairro, e via a lista). Agora:

- **Escolha por Estado → Cidade**: primeiro seleciona o estado (UF), depois busca a cidade pelo nome — funciona pra qualquer cidade, mesmo as que ainda não têm nenhum bairro cadastrado (antes, só apareciam cidades que já tinham pelo menos um). Como tem estado com centenas de cidades (Minas Gerais tem 853, por exemplo), a busca de cidade é por texto, não uma lista gigante pra rolar.
- **Busca de bairro**: depois de escolher a cidade, dá pra filtrar os bairros dela por nome.
- **Cadastrar bairro** (botão no topo): abre um formulário simples — só o nome — e cadastra na hora pra a cidade selecionada. Bloqueia nomes repetidos na mesma cidade.
- **Excluir bairro**: cada linha da lista tem um ícone de lixeira, com confirmação antes.

Não exige `db push` nem variável de ambiente nova (as rotas `POST` e `DELETE` de `/api/admin/locations/neighborhoods` são novas, mas usam a tabela `Neighborhood` que já existia).

## Atualização: Admin → Promoções real, com busca, filtro de status e ações

Essa tela também era só mockup. Agora:

- Lista as promoções reais de todas as empresas, com o nome da empresa junto.
- **Busca** por título da promoção ou nome da empresa.
- **Filtro rápido por status** (Todas / Ativas / Agendadas / Expiradas / Desativadas), em botões acima da lista.
- **Desativar/Ativar**: alterna o status da promoção entre "desativada" e "ativa" direto na lista — útil pra tirar do ar uma promoção problemática sem precisar excluir.
- **Excluir**: remove a promoção definitivamente, com confirmação antes.

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Cupons, mesma ideia de Promoções

Mesmo tratamento da tela de Promoções, agora em **Admin → Cupons**:

- Lista os cupons reais de todas as empresas, com o nome da empresa junto.
- **Busca** por título, código do cupom ou nome da empresa.
- **Filtro rápido por status** (Todos / Ativos / Expirados / Utilizados / Desativados).
- **Desativar/Ativar** e **Excluir**, direto na lista, com confirmação antes de excluir.

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Planos, o botão Editar agora salva de verdade

Essa tela já tinha o formulário de editar preços, mas era só aparência — as alterações ficavam só na tela (sumiam ao atualizar a página) porque não existia uma rota de API por trás. Curiosamente, o banco já tinha uma tabela `Plan` prevista desde o começo do projeto (só faltava ligar), então não precisou mudar o schema:

- **Editar** agora salva de verdade no banco: preço mensal, trimestral e anual, nome do plano, se ele aparece em destaque, e a lista de recursos (um por linha, no formulário).
- O número de "assinantes" mostrado em cada card passou a ser contado de verdade (quantas empresas estão em cada plano), em vez do número fixo que vinha do mockup.
- Se o banco nunca teve os 4 planos cadastrados (ex: o `seed.ts` completo nunca rodou), a tela cria eles sozinha na primeira vez que é aberta, com os mesmos valores padrão que sempre existiram no site — então não precisa de nenhum passo manual extra.

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Assinaturas, mesma ideia de Cupons/Promoções

Mesmo tratamento nas telas de Cupons e Promoções, agora em **Admin → Assinaturas**:

- Lista as assinaturas reais, com nome da empresa e do plano.
- **Busca** por empresa ou plano.
- **Filtro rápido por status** (Todas / Ativas / Atrasadas / Canceladas).
- **Cancelar/Reativar** e **Excluir**, direto na lista, com confirmação antes de excluir.

Detalhe técnico: o nome do plano é buscado à parte porque `Subscription.planoId` não tem uma relação formal com a tabela `Plan` no banco (funciona pelo mesmo valor do enum, mas sem um vínculo declarado) — resolvido buscando os 4 planos junto e casando pelo id na resposta da API.

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Financeiro, últimos pagamentos com busca, filtro e cobrança pelo WhatsApp

Os cards de topo (Receita recebida, MRR, Pendentes) e a tabela de "Últimos pagamentos" agora vêm do banco de verdade, e a tabela ganhou:

- **Busca** por empresa ou descrição do lançamento.
- **Filtro rápido por status** (Todos / Pagos / Pendentes / Falharam).
- **Trocar status na hora** — um seletor direto na linha (Pago/Pendente/Falhou), pra conciliar manualmente um pagamento que caiu na conta mas ainda estava marcado como pendente, por exemplo.
- **Excluir** um lançamento errado, com confirmação antes.
- **"Cobrar no Zap"** (pedido à parte, mas entrou junto): em pagamentos que não estão como "Pago", aparece um link que abre o WhatsApp já com uma mensagem de cobrança pronta, puxando o WhatsApp cadastrado da empresa — funciona do mesmo jeito que o "Enviar por WhatsApp" que já existe em outros lugares do site (usa `wa.me`, então abre o WhatsApp Web ou o app, sem precisar de nenhuma conta ou API paga). Se a empresa não tiver WhatsApp cadastrado, mostra "Sem WhatsApp" no lugar do link. **Importante**: isso abre uma conversa pra você mandar manualmente — não é um envio automático, porque isso exigiria a API oficial do WhatsApp Business (paga, com aprovação da Meta); se quiser automatizar de verdade no futuro, dá pra integrar depois.
- O **MRR** passou a somar só as assinaturas com status "ativa" (antes, o mockup somava todas, incluindo canceladas e atrasadas).

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Anúncios, mesma ideia de Cupons/Promoções

Mesmo tratamento aplicado nas outras telas, agora em **Admin → Anúncios**:

- Lista os anúncios/campanhas patrocinadas reais, com empresa, cidade, tipo, período, impressões e cliques.
- **Busca** por empresa, cidade ou tipo de anúncio.
- **Filtro rápido por status** (Todos / Ativos / Pausados / Encerrados).
- **Pausar/Ativar** direto na lista (o botão some quando o anúncio já está "encerrado", já que esse status é final).
- **Excluir**, com confirmação antes.

Detalhe técnico: a tabela `Ad` no banco não tem uma coluna própria de cidade — a cidade mostrada é puxada da empresa dona do anúncio (`company.cidadeNome`), então não precisou mudar o schema.

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Prospecção, quadro Kanban real com adicionar e excluir

O quadro de prospecção (Admin → Prospecção) agora lê e grava direto na tabela `Prospect` — antes era só o mockup fixo, e nem o botão "Iniciar prospecção" (em Empresas não reivindicadas) aparecia refletido aqui.

- **Adicionar empresa**: botão no topo abre uma busca (por nome ou cidade) entre as empresas que ainda não estão no funil; ao escolher uma, ela entra na coluna "Novo".
- **Avançar etapa**: continua funcionando como antes, mas agora salva o novo status no banco.
- **Excluir**: cada card ganhou um ícone de lixeira pra tirar a empresa do funil (com confirmação) — não apaga a empresa, só o card de prospecção dela.
- O telefone mostrado no card prioriza o WhatsApp cadastrado da empresa, caindo pro telefone comum se ela não tiver WhatsApp.

Não exige `db push` nem variável de ambiente nova (a tabela `Prospect` já existia no schema).

## Atualização: Admin → Relatórios com dados reais do banco

A tela de Relatórios trocou os números fixos do mockup por indicadores calculados na hora, direto no banco:

- Cards no topo: total de empresas, assinaturas ativas, receita recebida (soma dos pagamentos com status "pago"), total de leads gerados, categorias, cidades com cobertura e taxa de conversão (leads ÷ visualizações registradas em `CompanyAnalytics`).
- Gráfico "Empresas por cidade": conta as empresas de verdade agrupadas por cidade (top 10).
- Gráfico "Top categorias": conta as empresas por categoria (top 8).
- Gráfico "Leads por origem": agrupa os leads reais por origem (WhatsApp, telefone, cupom, site).
- Se ainda não existir nenhum dado pra um gráfico (ex: base nova, sem leads), mostra "Sem dados ainda" no lugar do gráfico vazio, em vez de quebrar.

O botão "Exportar" continua desativado — segue como próximo passo, se quiser (exportar em CSV/PDF).

Não exige `db push` nem variável de ambiente nova.

## Atualização: Admin → Configurações, agora salvando de verdade (e modo manutenção que funciona)

Essa tela era 100% decorativa — os campos e checkboxes existiam, mas o botão "Salvar configurações" não fazia nada e nada era lido do banco. Agora:

- **Precisa rodar `npx prisma db push`** — essa é a única atualização desse grupo que muda o schema: entrou uma tabela nova, `PlatformSettings`, com um único registro fixo (`id = "singleton"`) guardando as configurações da plataforma. Ela se cria sozinha com os valores padrão na primeira vez que alguém abre a tela ou visita o site (mesmo esquema de "self-healing" já usado em Admin → Planos), então não precisa rodar nenhum script manual além do `db push`.
- **Nome da plataforma** e **e-mail de suporte** agora salvam de verdade.
- Os dois toggles de **notificação interna** (novas reivindicações / pagamentos pendentes) salvam o estado, prontos pra quando eu ligar o envio de e-mail/WhatsApp de verdade pra equipe (hoje eles só guardam a preferência, ainda não disparam nada sozinhos).
- O **modo manutenção** agora faz o que o nome promete: quando ligado, qualquer visitante do site público vê uma tela de manutenção (`/manutencao`) em vez do site normal. `/admin` e `/login` continuam liberados, então você (ou outro admin) sempre consegue entrar e desligar o modo manutenção de novo, mesmo com ele ativado. Se por algum motivo a checagem falhar (ex: banco fora do ar num instante ruim), o site é liberado normalmente em vez de travar tudo.
- Tecnicamente, isso foi implementado no arquivo `src/proxy.ts` (o "Proxy" do Next.js 16 — versão renomeada do antigo `middleware.ts`), que já existia só pra liberar CORS das rotas `/api/*`; agora ele também checa `/api/settings` (rota pública, só com os campos não sensíveis) antes de deixar passar uma página pública.

Depois do `db push`, não precisa de nenhuma variável de ambiente nova.

## Atualização: Admin → Configurações — logo, nome, paleta de cores, módulos da home e rodapé

Ainda em Admin → Configurações, entraram os itens de identidade visual que faltavam:

- **Precisa rodar `npx prisma db push` de novo** — a tabela `PlatformSettings` ganhou campos novos (`logoUrl`, `paletaCor`, `mostrarCategoriasPopulares`, `mostrarEmpresasPertoDeVoce`, `mostrarOfertas`, `mostrarCupons`, `mostrarEmpresasDestaque`, `rodapeTexto`). Como todos têm valor padrão, o registro que já existe é atualizado automaticamente, sem perder o que já estava salvo.
- **Logo do site**: um botão de upload novo (mesmo mecanismo por FTP que já existe pra fotos de empresa — usa as variáveis `FTP_*`/`UPLOADS_PUBLIC_URL` do `.env`, então só funciona em produção depois que essas credenciais estiverem configuradas). A logo enviada aparece no cabeçalho e no rodapé do site público no lugar do "B" genérico. Dá pra remover e voltar pro ícone com a inicial do nome.
- **Nome da plataforma**: já existia o campo, mas agora ele realmente aparece no cabeçalho, no rodapé e no título das páginas — antes ficava só salvo, sem efeito visual nenhum.
- **Paleta de cores**: 5 opções prontas (Verde, Azul, Roxo, Laranja, Rosa) que trocam a cor principal (botões, links, destaques) do site inteiro assim que salva — sem precisar mexer em nenhum código, porque as cores já eram lidas de variáveis CSS.
- **Módulos da página inicial**: um interruptor pra cada seção da home — Categorias populares, Empresas perto de você, Ofertas perto de você, Cupons para você economizar e Empresas em destaque. Desligado, a seção some da home pública (e a busca dos dados dela nem é feita, pra não gastar consulta à toa).
- **Texto do rodapé**: campo de texto livre que aparece em todas as páginas públicas, sempre depois de "© {ano atual} {nome da plataforma}." — o ano e o nome são sempre calculados na hora, então nunca ficam desatualizados mesmo que você não mexa mais nessa tela.

Depois do `db push`, funciona sem nenhuma variável de ambiente nova — exceto a logo, que só fica visível de verdade depois de configurar o FTP da Hostinger (o mesmo passo pendente pra fotos de empresa).

## Atenção: sempre rodar `npx prisma db push` ANTES de subir uma atualização que mexe no schema

Depois da atualização de Configurações, o deploy na Vercel quebrou com esse erro:

```
Error [PrismaClientKnownRequestError]: Invalid `prisma.platformSettings.upsert()` invocation:
The column `...PlatformSettings.logoUrl` does not exist in the current database.
```

O motivo: o código novo (que já espera as colunas `logoUrl`, `paletaCor` etc.) foi enviado pro GitHub, mas o `npx prisma db push` contra o banco de produção da Hostinger não tinha sido rodado ainda — então o banco real ainda estava com a estrutura antiga. Como o layout principal do site consulta essas configurações pra montar a página (nome, logo, paleta de cor), **isso derruba o build inteiro**, não só a tela de Configurações.

A partir de agora, sempre que uma atualização destas mensagens disser "precisa rodar `db push`", **rode o `db push` antes de dar `git push`** (ou pelo menos antes do deploy terminar) — nessa ordem, pra nunca mais cair nesse erro. Se isso acontecer de novo, o conserto é sempre o mesmo: rodar `npx prisma db push` e depois clicar em "Redeploy" no último deploy que falhou na Vercel (não precisa de commit novo).

## Atualização: Admin → Dashboard (página inicial) com dados reais

A própria home do painel admin (`/admin`) ainda estava 100% no mockup antigo — nem os cards nem os gráficos vinham do banco. Agora:

- Os 8 cards (Total de empresas, Reivindicadas, Empresas Premium, Usuários, Assinaturas ativas, MRR, Leads, Cupons utilizados) vêm de contagens/somas reais.
- O gráfico "Visualizações totais — últimos 30 dias" soma os registros diários reais de `AnalyticsDaily` de todas as empresas.
- O gráfico "Assinantes por plano" conta as empresas de verdade por plano, com o nome do plano.
- Se ainda não tiver histórico de visualizações ou nenhum assinante, mostra uma mensagem no lugar do gráfico vazio.

Não exige `db push` nem variável de ambiente nova.

## Atualização: login redireciona pro lugar certo (e o celular ganhou o link pro painel)

Achei um bug real: depois de logar, a tela de login sempre mandava todo mundo pra `/minha-conta` — não importava se era um consumidor, uma empresa ou o admin. Isso não tinha nada a ver com ser celular ou computador; só ficava mais visível no celular porque lá não tinha nenhum outro link visível pra chegar no painel certo (no computador dava pra clicar no nome no canto superior direito, que já ia pro lugar certo).

- **Login agora manda cada papel pro lugar certo**: consumidor vai pra "Minha conta", empresa vai direto pro painel dela (`/painel`), admin vai direto pro painel administrativo (`/admin`).
- **Menu do celular (☰) ganhou um botão pro painel** quando a pessoa está logada — antes só mostrava o nome e o botão "Sair", sem nenhum jeito de chegar no painel pelo celular. Agora aparece "Painel da empresa" ou "Painel administrativo" (ou "Minha conta", pro consumidor), e ao entrar num desses painéis o menu hambúrguer que aparece já passa a ser o da área certa (o painel/admin tem menu próprio, diferente do menu do site público) — é a troca de "sair da página normal e ir pra área" que você pediu.
- **Tela "Minha conta"**: quando quem está logado é dono de empresa ou é admin, agora aparece um bloco em destaque no topo com um botão "Ir para o painel da empresa" (ou "...administrativo"), com uma frase explicando o que tem lá — fica fácil de achar mesmo se a pessoa cair nessa tela por engano.

Não exige `db push` nem variável de ambiente nova.

## Atualização: menu do celular no painel/admin ganhou "Ver site" e "Sair"

Faltava um detalhe no menu hambúrguer do painel da empresa e do admin, quando aberto pelo celular:

- **"Ver site público"**: já existia no menu de computador (rodapé da barra lateral), mas não aparecia no menu do celular. Agora aparece nos dois, e no celular abre em uma aba/janela nova (sem sair do painel, então não perde o que estava fazendo lá).
- **"Sair"**: nem o painel nem o admin tinham um jeito de fazer logout de dentro deles — o único jeito era voltar pro site público e sair por lá. Agora tem um botão "Sair" no rodapé do menu, tanto no computador quanto no celular, que desloga e já manda de volta pra tela de login.

Não exige `db push` nem variável de ambiente nova.

## O que ainda falta (próxima etapa)

Com essa atualização, **todas as telas do menu Admin listadas no painel — incluindo a própria página inicial (Dashboard) — estão funcionando com dados reais** (Empresas, Empresas não reivindicadas, Usuários, Categorias, Bairros/dados de referência, Promoções, Cupons, Planos, Assinaturas, Financeiro, Anúncios, Prospecção, Relatórios e Configurações). O que ainda fica de fora dessa etapa, pra quando quiser continuar:

1. **Exportar relatórios** (CSV/PDF) — hoje o botão "Exportar" existe na tela de Relatórios mas fica desativado.
2. **Disparo automático das notificações internas** (e-mail/WhatsApp real pra equipe quando entra uma reivindicação nova ou um pagamento fica pendente) — hoje só existe o toggle de preferência salvo; o envio em si ainda não está automatizado.
3. **Validação de verdade na reivindicação de perfil e no "esqueci minha senha"** (enviar código/link por e-mail/SMS real, em vez de mostrar na tela) — precisa de um serviço de envio (ex: Resend pra e-mail, alguma API de SMS) configurado com chave de API.

Me diz por qual desses quer que eu continue — ou me passa as credenciais de FTP do item acima que eu já deixo o upload de fotos funcionando em produção.
