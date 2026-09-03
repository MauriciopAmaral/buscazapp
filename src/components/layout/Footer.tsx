import Link from "next/link";
import Image from "next/image";

const columns = [
  {
    title: "BuscaZapp",
    links: [
      { href: "/", label: "Início" },
      { href: "/categorias", label: "Categorias" },
      { href: "/ofertas", label: "Ofertas" },
      { href: "/cupons", label: "Cupons" },
    ],
  },
  {
    title: "Para empresas",
    links: [
      { href: "/para-empresas", label: "Por que anunciar" },
      { href: "/cadastro?tipo=empresa", label: "Cadastre sua empresa" },
      { href: "/reivindicar", label: "Reivindicar empresa" },
      { href: "/painel/assinatura", label: "Planos e preços" },
      { href: "/painel", label: "Painel da empresa" },
    ],
  },
  {
    title: "Conta",
    links: [
      { href: "/login", label: "Entrar" },
      { href: "/cadastro", label: "Criar conta" },
      { href: "/minha-conta", label: "Minha conta" },
      { href: "/favoritos", label: "Favoritos" },
    ],
  },
];

interface FooterProps {
  siteName?: string;
  logoUrl?: string | null;
  rodapeTexto?: string;
}

export function Footer({
  siteName = "BuscaZapp",
  logoUrl,
  rodapeTexto = "Protótipo com dados fictícios — nenhuma informação aqui é real.",
}: FooterProps) {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
                  <Image src={logoUrl} alt={siteName} fill className="object-cover" unoptimized />
                </span>
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
                  {siteName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-lg font-bold text-ink-900">{siteName}</span>
            </Link>
            <p className="mt-3 text-sm font-medium text-ink-500">Encontre. Chame. Economize.</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink-900">{col.title}</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-500 hover:text-brand-600">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-ink-100 pt-6 text-xs text-ink-400">
          © {new Date().getFullYear()} {siteName}. {rodapeTexto}
        </div>
      </div>
    </footer>
  );
}
