import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";
import { Promotion } from "@/types";
import { Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { companies } from "@/mocks/companies";

export function OfferCard({ promotion }: { promotion: Promotion }) {
  const company = companies.find((c) => c.id === promotion.companyId);
  const desconto = Math.round(
    ((promotion.preco - promotion.precoPromocional) / promotion.preco) * 100
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white transition-shadow hover:shadow-md">
      <div className="relative h-36 w-full bg-ink-100">
        <Image src={promotion.imagemUrl} alt={promotion.titulo} fill className="object-cover" unoptimized />
        <span className="absolute left-3 top-3">
          <Badge variant="danger" icon={<Tag size={12} />}>
            {desconto}% OFF
          </Badge>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {company && (
          <Link href={`/empresa/${company.slug}`} className="text-xs font-medium text-brand-700 hover:underline">
            {company.nomeFantasia}
          </Link>
        )}
        <h3 className="text-sm font-semibold text-ink-900 line-clamp-1">{promotion.titulo}</h3>
        <p className="line-clamp-2 text-xs text-ink-500">{promotion.descricao}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xs text-ink-400 line-through">{formatCurrency(promotion.preco)}</span>
          <span className="text-base font-bold text-brand-700">{formatCurrency(promotion.precoPromocional)}</span>
        </div>
        <p className="text-xs text-ink-400">Válido até {formatDate(promotion.termino)}</p>
        {company && (
          <Link
            href={`/empresa/${company.slug}`}
            className="mt-2 rounded-xl border border-ink-200 py-2 text-center text-xs font-semibold text-ink-700 hover:bg-ink-50"
          >
            VER OFERTA
          </Link>
        )}
      </div>
    </div>
  );
}
