import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, className, containerClassName, id, children, ...props },
  ref
) {
  const selectId = id ?? props.name;
  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full appearance-none rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-ink-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
      </div>
    </div>
  );
});
