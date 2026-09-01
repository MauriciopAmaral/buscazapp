"use client";

import { useMemo, useState } from "react";
import { OfferCard } from "@/components/domain";
import { FilterBar, Select, EmptyState } from "@/components/ui";
import { promotions } from "@/mocks/promotions";
import { categories } from "@/mocks/categories";
import { cidadesPara, companies } from "@/mocks/companies";

export function OfertasClient() {
  const [categoria, setCategoria] = useState("");
  const [cidade, setCidade] = useState("");
  const [ordenacao, setOrdenacao] = useState("recentes");

  const results = useMemo(() => {
    let list = promotions.filter((p) => p.status === "ativa");

    if (categoria) {
      const cat = categories.find((c) => c.slug === categoria);
      list = list.filter((p) => {
        const company = companies.find((c) => c.id === p.companyId);
        return company?.categoriaId === cat?.id;
      });
    }
    if (cidade) {
      list = list.filter((p) => {
        const company = companies.find((c) => c.id === p.companyId);
        return company?.endereco.cidade === cidade;
      });
    }

    if (ordenacao === "desconto") {
      list = [...list].sort((a, b) => {
        const descA = (a.preco - a.precoPromocional) / a.preco;
        const descB = (b.preco - b.precoPromocional) / b.preco;
        return descB - descA;
      });
    } else {
      list = [...list].sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
    }

    return list;
  }, [categoria, cidade, ordenacao]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Ofertas perto de você</h1>
      <p className="mt-1 text-sm text-ink-500">Aproveite promoções ativas em empresas parceiras.</p>

      <FilterBar className="mt-6">
        <Select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} containerClassName="min-w-[170px]">
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.nome}
            </option>
          ))}
        </Select>
        <Select label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} containerClassName="min-w-[160px]">
          <option value="">Todas</option>
          {cidadesPara.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select label="Ordenar por" value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} containerClassName="min-w-[170px]">
          <option value="recentes">Mais recentes</option>
          <option value="desconto">Maior desconto</option>
        </Select>
      </FilterBar>

      <div className="mt-6">
        {results.length === 0 ? (
          <EmptyState title="Nenhuma oferta encontrada" description="Ajuste os filtros para ver mais resultados." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((p) => (
              <OfferCard key={p.id} promotion={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
