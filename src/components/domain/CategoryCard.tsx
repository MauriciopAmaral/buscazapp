import Link from "next/link";
import {
  Utensils, Pizza, Zap, Dumbbell, Scissors, Wrench, Stethoscope, ShoppingCart,
  Sparkles, PawPrint, Sofa, Shirt, Scale, Smartphone, Hammer, LucideIcon, Store,
} from "lucide-react";
import { Category } from "@/types";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  utensils: Utensils,
  pizza: Pizza,
  zap: Zap,
  dumbbell: Dumbbell,
  scissors: Scissors,
  wrench: Wrench,
  stethoscope: Stethoscope,
  "shopping-cart": ShoppingCart,
  sparkles: Sparkles,
  "paw-print": PawPrint,
  sofa: Sofa,
  shirt: Shirt,
  scale: Scale,
  smartphone: Smartphone,
  hammer: Hammer,
};

export function CategoryCard({ category, className }: { category: Category; className?: string }) {
  const Icon = icons[category.icone] ?? Store;
  return (
    <Link
      href={`/categoria/${category.slug}`}
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-2xl border border-ink-200 bg-white p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/50",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={22} />
      </span>
      <span className="text-sm font-medium text-ink-800">{category.nome}</span>
      <span className="text-xs text-ink-400">{category.totalEmpresas} empresas</span>
    </Link>
  );
}
