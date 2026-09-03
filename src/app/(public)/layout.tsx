import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getOrCreateSettings } from "@/lib/settings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getOrCreateSettings();

  return (
    <>
      <Header siteName={settings.nomePlataforma} logoUrl={settings.logoUrl} />
      <main className="flex-1">{children}</main>
      <Footer siteName={settings.nomePlataforma} logoUrl={settings.logoUrl} rodapeTexto={settings.rodapeTexto} />
    </>
  );
}
