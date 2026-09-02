import { CategoryCard } from "@/components/domain";
import { getCategories } from "@/lib/categoryData";

export const metadata = { title: "Categorias — BuscaZapp" };
// Sempre busca direto no banco a cada acesso — sem isso o Next cacheia o
// HTML gerado no primeiro acesso e categorias novas só apareceriam depois
// de um novo deploy.
export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Todas as categorias</h1>
      <p className="mt-1 text-sm text-ink-500">Encontre empresas por categoria de serviço.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  );
}
