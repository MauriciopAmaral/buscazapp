"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-lg border border-ink-200 p-2 text-ink-600 hover:bg-ink-50 disabled:opacity-40"
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-ink-400">…</span>}
          <button
            onClick={() => onChange(p)}
            className={cn(
              "h-9 w-9 rounded-lg text-sm font-medium",
              p === page ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
            )}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="rounded-lg border border-ink-200 p-2 text-ink-600 hover:bg-ink-50 disabled:opacity-40"
        aria-label="Próxima página"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
