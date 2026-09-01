import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className, containerClassName, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{icon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
            icon && "pl-10",
            error && "border-red-400 focus:border-red-500 focus:ring-red-100",
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {hint && !error && <span className="text-xs text-ink-500">{hint}</span>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, containerClassName, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          error && "border-red-400 focus:border-red-500 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
      {hint && !error && <span className="text-xs text-ink-500">{hint}</span>}
    </div>
  );
});
