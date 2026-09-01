import {
  LayoutDashboard, Building2, ShieldQuestion, FileCheck2, Users, Tags, Map,
  MapPinned, Home as HomeIcon, Tag, Ticket, CreditCard, Wallet, Megaphone,
  Target, FileBarChart, Settings,
} from "lucide-react";
import { Sidebar, SidebarItem } from "@/components/layout/Sidebar";
import { RequireRole } from "@/components/auth/RequireRole";

const items: SidebarItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/empresas", label: "Empresas", icon: <Building2 size={18} /> },
  { href: "/admin/empresas-nao-reivindicadas", label: "Não reivindicadas", icon: <ShieldQuestion size={18} /> },
  { href: "/admin/reivindicacoes", label: "Reivindicações", icon: <FileCheck2 size={18} /> },
  { href: "/admin/usuarios", label: "Usuários", icon: <Users size={18} /> },
  { href: "/admin/categorias", label: "Categorias", icon: <Tags size={18} /> },
  { href: "/admin/estados", label: "Estados", icon: <Map size={18} /> },
  { href: "/admin/cidades", label: "Cidades", icon: <MapPinned size={18} /> },
  { href: "/admin/bairros", label: "Bairros", icon: <HomeIcon size={18} /> },
  { href: "/admin/promocoes", label: "Promoções", icon: <Tag size={18} /> },
  { href: "/admin/cupons", label: "Cupons", icon: <Ticket size={18} /> },
  { href: "/admin/planos", label: "Planos", icon: <CreditCard size={18} /> },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: <Wallet size={18} /> },
  { href: "/admin/financeiro", label: "Financeiro", icon: <Wallet size={18} /> },
  { href: "/admin/anuncios", label: "Anúncios", icon: <Megaphone size={18} /> },
  { href: "/admin/prospeccao", label: "Prospecção", icon: <Target size={18} /> },
  { href: "/admin/relatorios", label: "Relatórios", icon: <FileBarChart size={18} /> },
  { href: "/admin/configuracoes", label: "Configurações", icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <Sidebar items={items} title="Administração" badge="Admin" switchHref="/" switchLabel="Ver site público">
        {children}
      </Sidebar>
    </RequireRole>
  );
}
