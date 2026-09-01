"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

interface FavoritesContextValue {
  favoriteIds: string[];
  toggleFavorite: (companyId: string) => void;
  isFavorite: (companyId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);
const STORAGE_KEY = "buscazapp:favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega favoritos persistidos ao montar
      if (raw) setFavoriteIds(JSON.parse(raw));
    } catch {
      // ignora
    }
  }, []);

  const toggleFavorite = (companyId: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignora
      }
      return next;
    });
  };

  const isFavorite = (companyId: string) => favoriteIds.includes(companyId);

  const value = useMemo(() => ({ favoriteIds, toggleFavorite, isFavorite }), [favoriteIds]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return ctx;
}
