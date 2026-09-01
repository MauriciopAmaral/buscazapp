"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, Tag, Ticket, Building2, User as UserIcon, Utensils } from "lucide-react";
import { Button, LinkButton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/categorias", label: "Categorias" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/cupons", label: "Cupons" },
  { href: "/clube", label: "Clube" },
  { href: "/para-empresas", label: "Para empresas" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
            B
          </span>
          <span className="text-lg font-bold text-ink-900">
            Busca<span className="text-brand-600">Zapp</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-600 transition-colors hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <UserMenu name={user.nome} role={user.role} onLogout={logout} />
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Entrar
              </LinkButton>
              <LinkButton href="/cadastro?tipo=empresa" variant="primary" size="sm">
                Cadastre sua empresa
              </LinkButton>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-ink-700 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Abrir menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-200 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {[
              { href: "/", label: "Início", icon: <Search size={16} /> },
              { href: "/categorias", label: "Categorias", icon: <Building2 size={16} /> },
              { href: "/ofertas", label: "Ofertas", icon: <Tag size={16} /> },
              { href: "/cupons", label: "Cupons", icon: <Ticket size={16} /> },
              { href: "/clube", label: "Clube", icon: <Utensils size={16} /> },
              { href: "/para-empresas", label: "Para empresas", icon: <Building2 size={16} /> },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-ink-100 pt-3">
            {user ? (
              <>
                <span className="flex items-center gap-2 px-3 text-sm text-ink-600">
                  <UserIcon size={16} /> {user.nome}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <LinkButton href="/login" variant="outline" size="sm">
                  Entrar
                </LinkButton>
                <LinkButton href="/cadastro?tipo=empresa" variant="primary" size="sm">
                  Cadastre sua empresa
                </LinkButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function UserMenu({
  name,
  role,
  onLogout,
}: {
  name: string;
  role: string;
  onLogout: () => void;
}) {
  const dashboardHref = role === "empresa" ? "/painel" : role === "admin" ? "/admin" : "/minha-conta";
  return (
    <div className="flex items-center gap-3">
      <Link
        href={dashboardHref}
        className="flex items-center gap-2 rounded-full border border-ink-200 py-1.5 pl-1.5 pr-3 text-sm font-medium text-ink-700 hover:bg-ink-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
          {name.charAt(0)}
        </span>
        {name.split(" ")[0]}
      </Link>
      <Button variant="ghost" size="sm" onClick={onLogout}>
        Sair
      </Button>
    </div>
  );
}
