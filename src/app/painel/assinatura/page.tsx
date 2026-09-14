"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Crown } from "lucide-react";
import { Button, Badge, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, cn } from "@/lib/utils";
import { TrocarPlanoPagamento } from "@/components/painel/TrocarPlanoPagamento";

type Periodicidade = "mensal" | "trimestral" | "anual";

const periodicidades: { key: Periodicidade; label: string }[] = [
  { key: "mensal", label: "Mensal" },
  { key: "trimestral", label: "Trimestral" },
  { key: "anual", label: "Anual" },
];

interface PlanoReal {
  id: string;
  nome: string;
  precoMensal: number;
  precoTrimestral: number;
  precoAnual: number;
  destaque: boolean;
  recursos: string[];
}

export default function AssinaturaPage() {
  const { token } = useAuth();
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");
  const [planos, setPlanos] = useState<PlanoReal[]>([]);
  const [planoAtualId, setPlanoAtualId] = useState<string>("gratuito");
  const [carregando, setCarregando] = useState(true);
  const [trocaAlvo, setTrocaAlvo] = useState<PlanoReal | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    setCarregando(true);
    try {
      const [resPlanos, resAssinatura] = await Promise.all([
        fetch("/api/planos"),
        fetch("/api/painel/subscription", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const jsonPlanos = await resPlanos.json().catch(() => null);
      const jsonAssinatura = await resAssinatura.json().catch(() => null);
      if (jsonPlanos?.success) setPlanos(jsonPlanos.data);
      if (jsonAssinatura?.success) {
        setPlanoAtualId(jsonAssinatura.data.planoId);
        if (jsonAssinatura.data.subscription?.periodicidade) {
          setPeriodicidade(jsonAssinatura.data.subscription.periodicidade);
        }
      }
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca planos e assinatura assim que o token estiver disponível
    carregar();
  }, [carregar]);

  const priceFor = (plano: PlanoReal) => {
    if (periodicidade === "mensal") return plano.precoMensal;
    if (periodicidade === "trimestral") return plano.precoTrimestral;
    return plano.precoAnual;
  };

  if (carregando) return <LoadingState rows={4} />;

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Assinatura</h1>
      <p className="text-sm text-ink-500">
        Plano atual: <strong className="text-ink-800">{planos.find((p) => p.id === planoAtualId)?.nome ?? planoAtualId}</strong>
      </p>

      {trocaAlvo ? (
        <div className="mt-6 max-w-md">
          {token && (
            <TrocarPlanoPagamento
              token={token}
              planoId={trocaAlvo.id}
              nomePlano={trocaAlvo.nome}
              periodicidade={periodicidade}
              onCancelar={() => setTrocaAlvo(null)}
              onConcluido={() => {
                setTrocaAlvo(null);
                carregar();
              }}
            />
          )}
        </div>
      ) : (
        <>
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
              const atual = plano.id === planoAtualId;
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
                    {priceFor(plano) === 0 ? "Grátis" : formatCurrency(priceFor(plano))}
                    {priceFor(plano) > 0 && (
                      <span className="text-sm font-normal text-ink-400">
                        /{periodicidade === "mensal" ? "mês" : periodicidade === "trimestral" ? "trim." : "ano"}
                      </span>
                    )}
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
                    onClick={() => setTrocaAlvo(plano)}
                  >
                    {atual ? "Plano atual" : "Assinar"}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-ink-400">
            Pagamento por cartão de crédito ou Pix, sem sair do painel. Trocar pro plano Gratuito não cobra nada.
          </p>
        </>
      )}
    </div>
  );
}
