"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Fechar"
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold text-ink-900">{title}</h2>}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="ml-auto rounded-full p-1.5 text-ink-500 hover:bg-ink-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
