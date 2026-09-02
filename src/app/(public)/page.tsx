import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { LinkButton, Badge } from "@/components/ui";
import { CompanyCard, CategoryCard, OfferCard, CouponCard } from "@/components/domain";
import { getCategories } from "@/lib/categoryData";
import { getCompanies, getFeaturedCompanies, getActivePromotions, getActiveCoupons } from "@/lib/companyData";
import { HomeSearchForm } from "./HomeSearchForm";
import { NearbyCompanies } from "./NearbyCompanies";

// Sempre busca direto no banco a cada acesso — sem isso o Next cacheia o
// HTML da home no primeiro acesso após o deploy, e empresas/categorias/
// cupons novos só apareceriam depois de um novo deploy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, nearbyCompanies, featuredCompanies, activePromotions, activeCoupons] = await Promise.all([
    getCategories(),
    getCompanies(8),
    getFeaturedCompanies(6),
    getActivePromotions(4),
    getActiveCoupons(4),
  ]);
  const popularCategories = categories.slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <Badge variant="brand" className="mx-auto">
            Plataforma nacional de busca
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            O que você está procurando?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 sm:text-base">
            Encontre empresas, profissionais, serviços, promoções e cupons perto de você.
          </p>

          <HomeSearchForm />

          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand-700">
            Encontre. Chame. Economize.
          </p>
        </div>
      </section>

      {/* Categorias populares */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeader title="Categorias populares" href="/categorias" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {popularCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* Empresas perto de você */}
      <section className="border-t border-ink-100 bg-ink-50/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader title="Empresas perto de você" href="/buscar" />
          <NearbyCompanies companies={nearbyCompanies} />
        </div>
      </section>

      {/* Ofertas */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeader title="Ofertas perto de você" href="/ofertas" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activePromotions.map((promo) => (
            <OfferCard key={promo.id} promotion={promo} />
          ))}
        </div>
      </section>

      {/* Cupons */}
      <section className="border-t border-ink-100 bg-ink-50/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader title="Cupons para você economizar" href="/cupons" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeCoupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        </div>
      </section>

      {/* Empresas em destaque */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeader title="Empresas em destaque" href="/buscar" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>

      {/* CTA empresas */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-ink-900 px-6 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <span className="flex items-center gap-2 justify-center sm:justify-start text-brand-400">
              <Store size={20} />
              <span className="text-sm font-semibold uppercase tracking-wide">Para empresas</span>
            </span>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Sua empresa ainda não está no BuscaZapp?
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-300">
              Cadastre sua empresa gratuitamente e comece a receber clientes direto no WhatsApp.
            </p>
          </div>
          <LinkButton href="/cadastro?tipo=empresa" variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
            CADASTRE SUA EMPRESA
          </LinkButton>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
        Ver tudo <ArrowRight size={14} />
      </Link>
    </div>
  );
}
