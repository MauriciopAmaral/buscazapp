import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { GeoProvider } from "@/context/GeoContext";
import { getOrCreateSettings } from "@/lib/settings";
import { paletaCssVars } from "@/lib/palettes";

export const metadata: Metadata = {
  title: "BuscaZapp — Encontre. Chame. Economize.",
  description:
    "BuscaZapp é a plataforma nacional para encontrar empresas, profissionais, serviços, promoções e cupons perto de você. Protótipo com dados fictícios.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A paleta de cor (Admin → Configurações) é aplicada aqui, pro site
  // inteiro (público e admin) — sobrescreve as variáveis --color-brand-*
  // que o Tailwind já lê de src/app/globals.css, então nenhuma classe
  // precisa mudar pra cor virar outra.
  const settings = await getOrCreateSettings();
  const paletteStyle = paletaCssVars(settings.paletaCor) as CSSProperties;

  return (
    <html lang="pt-BR" className="h-full antialiased" style={paletteStyle}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <FavoritesProvider>
            <GeoProvider>{children}</GeoProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
