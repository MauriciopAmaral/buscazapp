import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CompanyCard } from "@/components/domain";
import { EmptyState } from "@/components/ui";
import { getCategoryBySlug } from "@/lib/categoryData";
import { getCompaniesByCategorySlug } from "@/lib/companyData";

// Sem generateStaticParams: a página é renderizada sob demanda (dynamic
// rendering), buscando direto no banco — assim novas categorias/empresas
// aparecem sem precisar de um novo build.
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const companies = await getCompaniesByCategorySlug(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-ink-400">
        <Link href="/categorias" className="hover:text-brand-600">
          Categorias
        </Link>{" "}
        / <span className="text-ink-600">{category.nome}</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{category.nome}</h1>
        <Link
          href={`/buscar?categoria=${category.slug}`}
          className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
        >
          Buscar com filtros <ArrowRight size={14} />
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-500">{companies.length} empresas encontradas</p>

      {companies.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Nenhuma empresa nesta categoria ainda"
          description="Em breve novas empresas serão cadastradas nesta categoria."
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      )}
    </div>
  );
}
