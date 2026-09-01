"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { prospects as prospectsMock } from "@/mocks/claims";
import { ProspectStatus } from "@/types";
import { cn } from "@/lib/utils";

const columns: { key: ProspectStatus; label: string; color: string }[] = [
  { key: "novo", label: "Novo", color: "bg-ink-400" },
  { key: "contatado", label: "Contatado", color: "bg-blue-400" },
  { key: "interessado", label: "Interessado", color: "bg-amber-400" },
  { key: "reivindicado", label: "Reivindicado", color: "bg-purple-400" },
  { key: "assinante", label: "Assinante", color: "bg-brand-500" },
  { key: "nao_interessado", label: "Não interessado", color: "bg-red-400" },
];

export default function ProspeccaoPage() {
  const [prospects, setProspects] = useState(prospectsMock);

  const advance = (id: string) => {
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const idx = columns.findIndex((c) => c.key === p.status);
        const next = columns[Math.min(idx + 1, columns.length - 2)];
        return { ...p, status: next.key };
      })
    );
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Prospecção</h1>
      <p className="text-sm text-ink-500">CRM simples para acompanhar a captação de novas empresas.</p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const items = prospects.filter((p) => p.status === col.key);
          return (
            <div key={col.key} className="w-64 shrink-0">
              <div className="mb-2 flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", col.color)} />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {col.label} ({items.length})
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((p) => (
                  <div key={p.id} className="rounded-xl border border-ink-200 bg-white p-3">
                    <p className="text-sm font-medium text-ink-900">{p.companyNome}</p>
                    <p className="text-xs text-ink-500">{p.cidade}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                      <Phone size={11} /> {p.telefone}
                    </p>
                    {col.key !== "assinante" && col.key !== "nao_interessado" && (
                      <button
                        onClick={() => advance(p.id)}
                        className="mt-2 w-full rounded-lg bg-ink-100 py-1.5 text-xs font-medium text-ink-700 hover:bg-brand-100 hover:text-brand-700"
                      >
                        Avançar etapa
                      </button>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-xs text-ink-300">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
