"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { Heart, LogOut, Settings, Ticket, Wallet } from "lucide-react";
import { LinkButton, Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";

export default function MinhaContaPage() {
  const { user, logout, isLoading } = useAuth();
  const { favoriteIds } = useFavorites();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
          {user.nome.charAt(0)}
        </span>
        <div>
          <h1 className="text-lg font-bold text-ink-900">{user.nome}</h1>
          <p className="text-sm text-ink-500">{user.email}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MenuCard href="/favoritos" icon={<Heart size={18} />} title="Favoritos" subtitle={`${favoriteIds.length} salvos`} />
        <MenuCard href="/cupons" icon={<Ticket size={18} />} title="Meus cupons" subtitle="Ver disponíveis" />
        <MenuCard
          href="/cashback"
          icon={<Wallet size={18} />}
          title="Cashback"
          subtitle={`R$ ${(user.saldoCashback ?? 0).toFixed(2)} de saldo`}
        />
        <MenuCard href="/minha-conta" icon={<Settings size={18} />} title="Configurações" subtitle="Editar dados" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton href="/reivindicar" variant="outline">
          Sou dono de uma empresa
        </LinkButton>
        <Button variant="ghost" icon={<LogOut size={16} />} onClick={logout}>
          Sair da conta
        </Button>
      </div>
    </div>
  );
}

function MenuCard({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-4 hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      <span className="text-sm font-semibold text-ink-900">{title}</span>
      <span className="text-xs text-ink-500">{subtitle}</span>
    </Link>
  );
}
