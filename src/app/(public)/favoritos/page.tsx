"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { CompanyCard } from "@/components/domain";
import { EmptyState, LinkButton, LoadingState } from "@/components/ui";
import { useFavorites } from "@/context/FavoritesContext";
import { Company } from "@/types";

export default function FavoritosPage() {
  const { favoriteIds } = useFavorites();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/companies?pageSize=50");
        const json = await res.json().catch(() => null);
        if (!cancelled && json?.success) {
          setCompanies(json.data.empresas);
        }
      } catch {
        // sem conexão: mantém a lista vazia
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const favoritos = companies.filter((c) => favoriteIds.includes(c.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Meus favoritos</h1>
      <p className="mt-1 text-sm text-ink-500">Empresas que você salvou para acessar depois.</p>

      <div className="mt-6">
        {loading ? (
          <LoadingState />
        ) : favoritos.length === 0 ? (
          <EmptyState
            icon={<Heart size={22} />}
            title="Você ainda não tem favoritos"
            description="Toque no coração de uma empresa para salvá-la aqui."
            action={<LinkButton href="/buscar">Explorar empresas</LinkButton>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoritos.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
