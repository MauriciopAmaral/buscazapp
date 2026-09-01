import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "brand"
  | "ink"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "sponsor";

const variantStyles: Record<Variant, string> = {
  brand: "bg-brand-50 text-brand-700 border border-brand-200",
  ink: "bg-ink-100 text-ink-700 border border-ink-200",
  gold: "bg-amber-50 text-amber-700 border border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-orange-50 text-orange-700 border border-orange-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  outline: "bg-white text-ink-600 border border-ink-300",
  sponsor: "bg-ink-900 text-white",
};

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ children, variant = "ink", icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        variantStyles[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
