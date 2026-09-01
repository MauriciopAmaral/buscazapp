import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: number;
  className?: string;
}

export function MetricCard({ label, value, icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn("rounded-2xl border border-ink-200 bg-white p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between">
        <span className="text-sm text-ink-500">{label}</span>
        {icon && <span className="rounded-lg bg-brand-50 p-2 text-brand-600">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-semibold text-ink-900">{value}</span>
        {typeof trend === "number" && (
          <span
            className={cn(
              "mb-1 flex items-center gap-0.5 text-xs font-medium",
              trend >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
