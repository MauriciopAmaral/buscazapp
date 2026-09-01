import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-ink-900 text-white hover:bg-ink-800 shadow-sm",
  outline: "border border-ink-300 text-ink-700 hover:bg-ink-50 bg-white",
  ghost: "text-ink-600 hover:bg-ink-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1fb958] shadow-sm",
};

const sizeStyles: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 gap-2 rounded-xl",
  lg: "text-base px-6 py-3 gap-2 rounded-xl",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

interface ButtonProps extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  href?: undefined;
}

interface LinkButtonProps extends BaseProps {
  href: string;
  target?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, iconRight, fullWidth, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
});

export function LinkButton({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  href,
  target,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
    >
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
