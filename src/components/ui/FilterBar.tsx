"use client";

import { ReactNode, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface FilterBarProps {
  children: ReactNode;
  className?: string;
  onClear?: () => void;
}

export function FilterBar({ children, className, onClear }: FilterBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("rounded-2xl border border-ink-200 bg-white", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 p-3 sm:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-ink-700"
        >
          <SlidersHorizontal size={16} />
          Filtros
        </button>
        {onClear && (
          <button onClick={onClear} className="flex items-center gap-1 text-xs text-ink-500">
            <X size={14} /> Limpar
          </button>
        )}
      </div>
      <div
        className={cn(
          "flex-col gap-3 p-4 sm:flex sm:flex-row sm:flex-wrap sm:items-end",
          open ? "flex" : "hidden sm:flex"
        )}
      >
        {children}
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} className="hidden sm:inline-flex">
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
