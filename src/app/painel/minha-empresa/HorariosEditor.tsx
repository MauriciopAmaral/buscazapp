"use client";

import { useState } from "react";
import { HorarioDia } from "@/types";
import { cn } from "@/lib/utils";

const diaLabel: Record<string, string> = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
};

export function HorariosEditor({ horarios }: { horarios: HorarioDia[] }) {
  const [dias, setDias] = useState(horarios);

  const update = (dia: string, patch: Partial<HorarioDia>) => {
    setDias((prev) => prev.map((d) => (d.dia === dia ? { ...d, ...patch } : d)));
  };

  return (
    <div className="flex flex-col gap-2">
      {dias.map((d) => (
        <div
          key={d.dia}
          className="grid grid-cols-1 items-center gap-2 rounded-xl border border-ink-100 p-3 sm:grid-cols-[100px_auto_1fr_1fr]"
        >
          <span className="text-sm font-medium text-ink-800">{diaLabel[d.dia]}</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => update(d.dia, { aberto: true })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium",
                d.aberto ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500"
              )}
            >
              Aberto
            </button>
            <button
              type="button"
              onClick={() => update(d.dia, { aberto: false })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium",
                !d.aberto ? "bg-ink-800 text-white" : "bg-ink-100 text-ink-500"
              )}
            >
              Fechado
            </button>
          </div>
          <input
            type="time"
            disabled={!d.aberto}
            value={d.inicio ?? ""}
            onChange={(e) => update(d.dia, { inicio: e.target.value })}
            className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm disabled:bg-ink-50 disabled:text-ink-300"
          />
          <input
            type="time"
            disabled={!d.aberto}
            value={d.fim ?? ""}
            onChange={(e) => update(d.dia, { fim: e.target.value })}
            className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm disabled:bg-ink-50 disabled:text-ink-300"
          />
        </div>
      ))}
    </div>
  );
}
