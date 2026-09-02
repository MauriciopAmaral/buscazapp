import { CouponCard } from "@/components/domain";
import { getActiveCoupons } from "@/lib/companyData";

export const metadata = { title: "Cupons — BuscaZapp" };
// Sempre busca direto no banco a cada acesso — sem isso os cupons novos só
// apareceriam depois de um novo deploy.
export const dynamic = "force-dynamic";

export default async function CuponsPage() {
  const ativos = await getActiveCoupons();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Cupons de desconto</h1>
      <p className="mt-1 text-sm text-ink-500">Resgate cupons e economize nas suas empresas favoritas.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ativos.map((coupon) => (
          <CouponCard key={coupon.id} coupon={coupon} />
        ))}
      </div>
    </div>
  );
}
