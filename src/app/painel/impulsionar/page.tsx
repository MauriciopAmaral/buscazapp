"use client";

import { useEffect, useState } from "react";
import { Rocket, Home, LayoutGrid, MapPin, Star, Tag, Loader2, History } from "lucide-react";
import { Badge, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCurrentCompanyLive } from "@/lib/useCurrentCompany";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { BOOST_CATALOGO, BOOST_DURACOES, BoostTipo, calcularValorBoost } from "@/lib/boostCatalog";

const icones: Record<BoostTipo, React.ReactNode> = {
  destaque_home: <Home size={18} />,
  destaque_categoria: <LayoutGrid size={18} />,
  destaque_cidade: <MapPin size={18} />,
  resultado_patrocinado: <Star size={18} />,
  promocao_destacada: <Tag size={18} />,
};

interface BoostRow {
  id: string;
  tipo: BoostTipo;
  dias: number;
  valor: number | string;
  status: "pendente" | "pago" | "cancelado" | "expirado";
  createdAt: string;
  ad?: { termino: string; status: string } | null;
}

const statusBadge: Record<BoostRow["status"], { label: string; variant: "success" | "warning" | "danger" | "ink" }> = {
  pago: { label: "Pago — ativo", variant: "success" },
  pendente: { label: "Aguardando pagamento", variant: "warning" },
  cancelado: { label: "Cancelado", variant: "danger" },
  expirado: { label: "Expirado", variant: "ink" },
};

export default function ImpulsionarPage() {
  const { token } = useAuth();
  const { company, loading: carregandoEmpresa } = useCurrentCompanyLive();
  const [tipo, setTipo] = useState<BoostTipo>("destaque_home");
  const [dias, setDias] = useState<number>(7);
  const [historico, setHistorico] = useState<BoostRow[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarHistorico = () => {
    if (!token) return;
    setCarregandoHistorico(true);
    fetch("/api/painel/boosts", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setHistorico(json.data);
      })
      .catch(() => undefined)
      .finally(() => setCarregandoHistorico(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega o histórico assim que o token estiver disponível
    carregarHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const total = calcularValorBoost(tipo, dias);

  const contratar = async () => {
    if (!token) return;
    setProcessando(true);
    setErro(null);
    try {
      const res = await fetch("/api/painel/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo, dias }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível iniciar o pagamento.");
        setProcessando(false);
        return;
      }
      if (!json.data.initPoint) {
        setErro("O Mercado Pago não devolveu um link de pagamento. Tente novamente.");
        setProcessando(false);
        return;
      }
      // Sai do BuscaZapp e vai pro checkout do Mercado Pago — volta pra
      // /painel/impulsionar/retorno depois que a pessoa pagar (ou desistir).
      window.location.href = json.data.initPoint;
    } catch {
      setErro("Não foi possível conectar ao servidor.");
      setProcessando(false);
    }
  };

  if (carregandoEmpresa || !company) {
    return <LoadingState rows={4} />;
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-ink-500">
        <Rocket size={16} />
        <span className="text-sm">Autoatendimento</span>
      </div>
      <h1 className="mt-1 text-xl font-bold text-ink-900 sm:text-2xl">Impulsionar {company.nomeFantasia}</h1>
      <p className="mt-1 text-sm text-ink-500">
        Escolha um formato de destaque, pague pelo Mercado Pago (cartão ou Pix) e o impulsionamento é ativado
        automaticamente assim que o pagamento for aprovado.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(Object.keys(BOOST_CATALOGO) as BoostTipo[]).map((key) => {
          const o = BOOST_CATALOGO[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTipo(key)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                tipo === key ? "border-brand-500 bg-brand-50/60" : "border-ink-200 bg-white hover:border-ink-300"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  tipo === key ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500"
                )}
              >
                {icones[key]}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{o.nome}</p>
                <p className="mt-0.5 text-xs text-ink-500">{o.descricao}</p>
                <p className="mt-1 text-xs font-medium text-brand-700">{formatCurrency(o.precoDia)}/dia</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <p className="text-sm font-semibold text-ink-900">Duração</p>
        <div className="mt-3 inline-flex rounded-xl bg-ink-100 p-1">
          {BOOST_DURACOES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDias(d)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                dias === d ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
              )}
            >
              {d} dias
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
          <div>
            <p className="text-xs text-ink-500">Total a pagar</p>
            <p className="text-2xl font-bold text-ink-900">{formatCurrency(total)}</p>
          </div>
          <button
            type="button"
            onClick={contratar}
            disabled={processando}
            className="flex items-center gap-2 rounded-xl bg-[#009EE3] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0087c4] disabled:opacity-60"
          >
            {processando ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
            {processando ? "Abrindo pagamento..." : "Pagar com Mercado Pago"}
          </button>
        </div>

        {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

        <p className="mt-4 text-xs text-ink-400">
          Você será levado pro checkout seguro do Mercado Pago. O impulsionamento só é ativado depois que o
          pagamento é aprovado — Pix costuma confirmar em segundos, cartão na hora, boleto pode levar até 3 dias
          úteis.
        </p>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <History size={16} /> Histórico de impulsionamentos
        </div>
        <div className="mt-3">
          {carregandoHistorico ? (
            <LoadingState rows={2} />
          ) : historico.length === 0 ? (
            <p className="text-sm text-ink-400">Nenhum impulsionamento contratado ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {historico.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                      {icones[b.tipo]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-900">
                        {BOOST_CATALOGO[b.tipo]?.nome ?? b.tipo} — {b.dias} dias
                      </p>
                      <p className="text-xs text-ink-500">
                        {formatCurrency(Number(b.valor))} · comprado em {formatDate(b.createdAt)}
                        {b.ad && b.status === "pago" && <> · ativo até {formatDate(b.ad.termino)}</>}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusBadge[b.status].variant}>{statusBadge[b.status].label}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
