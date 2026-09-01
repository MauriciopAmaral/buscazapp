"use client";

import { Search } from "lucide-react";
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, containerClassName, ...props },
  ref
) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" size={18} />
      <input
        ref={ref}
        type="search"
        className={cn(
          "w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          className
        )}
        {...props}
      />
    </div>
  );
});
