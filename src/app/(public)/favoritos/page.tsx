"use client";

import { Heart } from "lucide-react";
import { CompanyCard } from "@/components/domain";
import { EmptyState, LinkButton } from "@/components/ui";
import { useFavorites } from "@/context/FavoritesContext";
import { companies } from "@/mocks/companies";

export default function FavoritosPage() {
  const { favoriteIds } = useFavorites();
  const favoritos = companies.filter((c) => favoriteIds.includes(c.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Meus favoritos</h1>
      <p className="mt-1 text-sm text-ink-500">Empresas que você salvou para acessar depois.</p>

      <div className="mt-6">
        {favoritos.length === 0 ? (
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
