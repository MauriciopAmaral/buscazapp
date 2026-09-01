"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, ReactNode } from "react";
import { Menu, X, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  title: string;
  badge?: string;
  switchHref?: string;
  switchLabel?: string;
  children: ReactNode;
}

export function Sidebar({ items, title, badge, switchHref, switchLabel, children }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavList = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-ink-50/60">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
            B
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">BuscaZapp</p>
            <p className="text-xs text-ink-500">{title}</p>
          </div>
        </div>
        {NavList}
        {switchHref && (
          <div className="border-t border-ink-100 p-3">
            <Link
              href={switchHref}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-100"
            >
              <ArrowLeftRight size={16} />
              {switchLabel}
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-ink-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
                  B
                </span>
                <p className="text-sm font-bold text-ink-900">{title}</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-500">
                <X size={20} />
              </button>
            </div>
            {NavList}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-ink-700" aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            {badge && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {badge}
              </span>
            )}
            {title}
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
