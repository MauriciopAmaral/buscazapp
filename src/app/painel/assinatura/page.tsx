"use client";

import { useState } from "react";
import { Check, Crown } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useCurrentCompany } from "@/lib/useCurrentCompany";
import { planos } from "@/mocks/subscriptions";
import { formatCurrency, cn } from "@/lib/utils";

const periodicidades = [
  { key: "mensal" as const, label: "Mensal" },
  { key: "trimestral" as const, label: "Trimestral" },
  { key: "anual" as const, label: "Anual" },
];

export default function AssinaturaPage() {
  const company = useCurrentCompany();
  const [periodicidade, setPeriodicidade] = useState<"mensal" | "trimestral" | "anual">("mensal");

  const priceFor = (planoId: string) => {
    const plano = planos.find((p) => p.id === planoId)!;
    if (periodicidade === "mensal") return plano.precoMensal;
    if (periodicidade === "trimestral") return plano.precoTrimestral;
    return plano.precoAnual;
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Assinatura</h1>
      <p className="text-sm text-ink-500">
        Plano atual: <strong className="text-ink-800">{planos.find((p) => p.id === company.planoId)?.nome}</strong>
      </p>

      <div className="mt-5 inline-flex rounded-xl bg-ink-100 p-1">
        {periodicidades.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodicidade(p.key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              periodicidade === p.key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planos.map((plano) => {
          const atual = plano.id === company.planoId;
          return (
            <div
              key={plano.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-5",
                plano.destaque ? "border-brand-500 shadow-md ring-1 ring-brand-100" : "border-ink-200"
              )}
            >
              {plano.destaque && (
                <Badge variant="brand" icon={<Crown size={12} />} className="mb-3 w-fit">
                  Mais popular
                </Badge>
              )}
              <h2 className="text-lg font-bold text-ink-900">{plano.nome}</h2>
              <p className="mt-1 text-2xl font-bold text-ink-900">
                {formatCurrency(priceFor(plano.id))}
                <span className="text-sm font-normal text-ink-400">
                  /{periodicidade === "mensal" ? "mês" : periodicidade === "trimestral" ? "trim." : "ano"}
                </span>
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {plano.recursos.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-xs text-ink-600">
                    <Check size={14} className="mt-0.5 shrink-0 text-brand-600" />
                    {r}
                  </li>
                ))}
              </ul>
              <Button
                variant={atual ? "outline" : plano.destaque ? "primary" : "secondary"}
                fullWidth
                disabled={atual}
                className="mt-5"
              >
                {atual ? "Plano atual" : "Assinar"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-ink-400">
        Pagamento será apenas simulado neste protótipo — nenhuma cobrança real é realizada.
      </p>
    </div>
  );
}
