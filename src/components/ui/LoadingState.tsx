import { cn } from "@/lib/utils";

export function LoadingState({ className, rows = 3 }: { className?: string; rows?: number }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-ink-200 bg-white p-4">
          <div className="h-32 w-full rounded-xl bg-ink-100" />
          <div className="mt-3 h-4 w-3/4 rounded bg-ink-100" />
          <div className="mt-2 h-3 w-1/2 rounded bg-ink-100" />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600",
        className
      )}
    />
  );
}
