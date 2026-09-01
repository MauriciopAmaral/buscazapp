import {
  LayoutDashboard, Building2, Images, Package, Wrench, Tag, Ticket, Star,
  Users, BarChart3, CreditCard, Wallet, Settings, Rocket,
} from "lucide-react";
import { Sidebar, SidebarItem } from "@/components/layout/Sidebar";
import { RequireRole } from "@/components/auth/RequireRole";

const items: SidebarItem[] = [
  { href: "/painel", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/painel/minha-empresa", label: "Minha empresa", icon: <Building2 size={18} /> },
  { href: "/painel/fotos", label: "Fotos", icon: <Images size={18} /> },
  { href: "/painel/produtos", label: "Produtos", icon: <Package size={18} /> },
  { href: "/painel/servicos", label: "Serviços", icon: <Wrench size={18} /> },
  { href: "/painel/promocoes", label: "Promoções", icon: <Tag size={18} /> },
  { href: "/painel/cupons", label: "Cupons", icon: <Ticket size={18} /> },
  { href: "/painel/avaliacoes", label: "Avaliações", icon: <Star size={18} /> },
  { href: "/painel/leads", label: "Leads", icon: <Users size={18} /> },
  { href: "/painel/estatisticas", label: "Estatísticas", icon: <BarChart3 size={18} /> },
  { href: "/painel/impulsionar", label: "Impulsionar", icon: <Rocket size={18} /> },
  { href: "/painel/assinatura", label: "Assinatura", icon: <CreditCard size={18} /> },
  { href: "/painel/financeiro", label: "Financeiro", icon: <Wallet size={18} /> },
  { href: "/painel/configuracoes", label: "Configurações", icon: <Settings size={18} /> },
];

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="empresa">
      <Sidebar items={items} title="Painel da empresa" badge="Empresa" switchHref="/" switchLabel="Ver site público">
        {children}
      </Sidebar>
    </RequireRole>
  );
}
