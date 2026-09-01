import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { GeoProvider } from "@/context/GeoContext";

export const metadata: Metadata = {
  title: "BuscaZapp — Encontre. Chame. Economize.",
  description:
    "BuscaZapp é a plataforma nacional para encontrar empresas, profissionais, serviços, promoções e cupons perto de você. Protótipo com dados fictícios.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
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
