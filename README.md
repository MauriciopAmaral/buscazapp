# BuscaZapp — Protótipo de Frontend

Protótipo navegável do BuscaZapp construído com **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**. Não há backend, banco de dados ou integrações reais nesta etapa — todos os dados vêm de mocks em `src/mocks`.

## Como rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

Para build de produção:

```bash
npm run build
npm run start
```

## Estrutura

- `src/app/(public)` — área pública (Home, busca, categorias, perfil de empresa, ofertas, cupons, login/cadastro, reivindicação de empresa)
- `src/app/painel` — painel da empresa (dashboard, minha empresa, produtos, serviços, promoções, cupons, avaliações, leads, estatísticas, assinatura, financeiro, configurações)
- `src/app/admin` — administração BuscaZapp (dashboard, empresas, reivindicações, categorias, localidades, planos, anúncios, prospecção/CRM, relatórios)
- `src/components/ui` — design system (Button, Input, SearchInput, Select, Modal, Badge, DataTable, Pagination, FilterBar, EmptyState, LoadingState, MetricCard)
- `src/components/layout` — Header, Footer, Sidebar (usada no painel e no admin)
- `src/components/domain` — CompanyCard, CategoryCard, CouponCard, OfferCard, ReviewCard
- `src/mocks` — todos os dados fictícios centralizados (30 empresas, 15 categorias, 10 promoções, 10 cupons, 20 avaliações, planos, usuários, leads, reivindicações, prospecção, anúncios, localidades do Pará)
- `src/services` — camada de serviço que hoje consome os mocks; no futuro basta trocar a implementação interna por chamadas de API real, sem alterar as telas
- `src/types` — interfaces TypeScript compartilhadas (Company, Category, Coupon, Promotion, Review, Subscription, Analytics, etc.)
- `src/context` — AuthContext (login simulado por papel: consumidor / empresa / admin) e FavoritesContext (favoritos persistidos em localStorage)

## Login simulado

Nas telas `/login` e `/cadastro` há três atalhos de desenvolvimento:

- **Entrar como consumidor** → `/minha-conta`
- **Entrar como empresa** → `/painel`
- **Entrar como administrador** → `/admin`

## Fluxos navegáveis prontos

- Home → Buscar → Perfil da empresa → Cupom → WhatsApp
- Perfil não reivindicado → "Sou proprietário" → Reivindicação (6 etapas) → Painel liberado
- Login como empresa → Painel → Promoções → Criar promoção
- Admin → Empresas → Visualizar → (ações de status/verificação)

## Próxima fase

Este frontend foi organizado para facilitar a substituição dos mocks por chamadas de API real: `src/services/*.ts` concentra toda a leitura de dados hoje feita sobre `src/mocks/*`. Quando o backend (PostgreSQL + API) estiver pronto, basta reescrever a implementação interna de cada serviço.
