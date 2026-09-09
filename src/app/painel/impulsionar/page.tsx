"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Rocket,
  Home,
  LayoutGrid,
  MapPin,
  Star,
  Tag,
  Loader2,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import { Badge, Button, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCurrentCompanyLive } from "@/lib/useCurrentCompany";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { BOOST_CATALOGO, BOOST_DURACOES, BoostTipo, calcularValorBoost, formatDias } from "@/lib/boostCatalog";
import { MercadoPagoPaymentBrick } from "@/components/painel/MercadoPagoPaymentBrick";

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

type Etapa = "escolha" | "pagamento" | "sucesso" | "recusado";

interface PixInfo {
  qrCode: string | null;
  qrCodeBase64: string | null;
}

const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

export default function ImpulsionarPage() {
  const { token } = useAuth();
  const { company, loading: carregandoEmpresa } = useCurrentCompanyLive();
  const [tipo, setTipo] = useState<BoostTipo>("destaque_home");
  const [dias, setDias] = useState<number>(7);
  const [historico, setHistorico] = useState<BoostRow[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [etapa, setEtapa] = useState<Etapa>("escolha");
  const [boostId, setBoostId] = useState<string | null>(null);
  const [boostValor, setBoostValor] = useState(0);
  const [pix, setPix] = useState<PixInfo | null>(null);
  const [aguardandoPix, setAguardandoPix] = useState(false);
  const [terminoAtivo, setTerminoAtivo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

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

  // Enquanto tem um Pix pendente na tela, fica consultando o status do
  // Boost a cada 3s — é o webhook do Mercado Pago que confirma o Pix
  // (a resposta do brick só devolve o QR code, não sabe na hora se a
  // pessoa já pagou).
  useEffect(() => {
    if (!aguardandoPix || !boostId || !token) return;
    const intervalo = setInterval(() => {
      fetch(`/api/painel/boosts/${boostId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && json.data.status === "pago") {
            setAguardandoPix(false);
            setTerminoAtivo(json.data.ad?.termino ?? null);
            setEtapa("sucesso");
          } else if (json?.success && json.data.status === "cancelado") {
            setAguardandoPix(false);
            setEtapa("recusado");
          }
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(intervalo);
  }, [aguardandoPix, boostId, token]);

  const total = calcularValorBoost(tipo, dias);

  const iniciarPagamento = async () => {
    if (!token) return;
    setCriando(true);
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
        return;
      }
      setBoostId(json.data.boostId);
      setBoostValor(json.data.valor);
      setPix(null);
      setAguardandoPix(false);
      setEtapa("pagamento");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCriando(false);
    }
  };

  const pagar = async (formData: Record<string, unknown>) => {
    if (!token || !boostId) return;
    setErro(null);
    try {
      const res = await fetch(`/api/painel/boosts/${boostId}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível processar o pagamento.");
        return;
      }
      const data = json.data;
      if (data.status === "pago") {
        setTerminoAtivo(data.ad?.termino ?? null);
        setEtapa("sucesso");
        carregarHistorico();
      } else if (data.pix?.qrCode || data.pix?.qrCodeBase64) {
        // Pix criado — mostra o QR code e fica consultando até confirmar.
        setPix(data.pix);
        setAguardandoPix(true);
      } else if (data.status === "cancelado") {
        setEtapa("recusado");
      } else {
        // Cartão em análise (raro) — trata como pendente, mesma lógica do Pix.
        setAguardandoPix(true);
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    }
  };

  const recomecar = () => {
    setEtapa("escolha");
    setBoostId(null);
    setBoostValor(0);
    setPix(null);
    setAguardandoPix(false);
    setErro(null);
    carregarHistorico();
  };

  const copiarPix = () => {
    if (!pix?.qrCode) return;
    navigator.clipboard
      .writeText(pix.qrCode)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      })
      .catch(() => undefined);
  };

  if (carregandoEmpresa || !company) {
    return <LoadingState rows={4} />;
  }

  const catalogoAtual = BOOST_CATALOGO[tipo];

  return (
    <div>
      <div className="flex items-center gap-2 text-ink-500">
        <Rocket size={16} />
        <span className="text-sm">Autoatendimento</span>
      </div>
      <h1 className="mt-1 text-xl font-bold text-ink-900 sm:text-2xl">Impulsionar {company.nomeFantasia}</h1>
      <p className="mt-1 text-sm text-ink-500">
        Escolha um formato de destaque, pague com cartão de crédito ou Pix sem sair do BuscaZapp, e o
        impulsionamento é ativado automaticamente assim que o pagamento for aprovado.
      </p>

      {etapa === "escolha" && (
        <>
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
                  {formatDias(d)}
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
                onClick={iniciarPagamento}
                disabled={criando}
                className="flex items-center gap-2 rounded-xl bg-[#009EE3] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0087c4] disabled:opacity-60"
              >
                {criando ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                {criando ? "Preparando pagamento..." : "Continuar para pagamento"}
              </button>
            </div>

            {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

            <p className="mt-4 text-xs text-ink-400">
              O pagamento é feito aqui mesmo, sem sair do BuscaZapp — cartão de crédito ou Pix. O impulsionamento só
              é ativado depois que o pagamento é aprovado; Pix costuma confirmar em segundos, cartão na hora.
            </p>
          </div>
        </>
      )}

      {etapa === "pagamento" && (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
          <button
            type="button"
            onClick={recomecar}
            className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-700"
          >
            <ArrowLeft size={14} /> Voltar
          </button>

          <div className="mt-3 flex items-center justify-between gap-3 border-b border-ink-100 pb-4">
            <div>
              <p className="text-sm font-semibold text-ink-900">{catalogoAtual.nome}</p>
              <p className="text-xs text-ink-500">{formatDias(dias)}</p>
            </div>
            <p className="text-xl font-bold text-ink-900">{formatCurrency(boostValor)}</p>
          </div>

          {!publicKey ? (
            <p className="mt-4 text-sm text-red-600">
              Pagamento ainda não foi configurado neste projeto (falta a variável de ambiente
              NEXT_PUBLIC_MP_PUBLIC_KEY).
            </p>
          ) : pix ? (
            <div className="mt-5 flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Clock size={22} />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink-900">Escaneie o QR Code pra pagar com Pix</p>
              {pix.qrCodeBase64 && (
                <Image
                  src={`data:image/png;base64,${pix.qrCodeBase64}`}
                  alt="QR Code Pix"
                  width={220}
                  height={220}
                  unoptimized
                  className="mt-3 h-56 w-56 rounded-xl border border-ink-200"
                />
              )}
              {pix.qrCode && (
                <button
                  type="button"
                  onClick={copiarPix}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50"
                >
                  {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiado ? "Copiado!" : "Copiar código Pix"}
                </button>
              )}
              <p className="mt-4 flex items-center gap-2 text-xs text-ink-400">
                <Loader2 size={13} className="animate-spin" /> Aguardando confirmação — a página atualiza sozinha
                assim que o Pix for pago.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <MercadoPagoPaymentBrick
                publicKey={publicKey}
                amount={boostValor}
                onSubmit={pagar}
                onError={(msg) => setErro(msg)}
              />
            </div>
          )}

          {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
        </div>
      )}

      {etapa === "sucesso" && (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-ink-200 bg-white px-4 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={30} />
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink-900">Pagamento aprovado!</h2>
          <p className="mt-2 text-sm text-ink-500">
            <strong>{catalogoAtual.nome}</strong> por {formatDias(dias)}, {formatCurrency(boostValor)} — já está
            ativo{terminoAtivo && <> até {formatDate(terminoAtivo)}</>}.
          </p>
          <Button className="mt-6" onClick={recomecar}>
            Impulsionar outro anúncio
          </Button>
        </div>
      )}

      {etapa === "recusado" && (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-ink-200 bg-white px-4 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle size={30} />
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink-900">Pagamento não aprovado</h2>
          <p className="mt-2 text-sm text-ink-500">
            Nenhuma cobrança foi feita — pode tentar de novo quando quiser, com outro cartão ou pelo Pix.
          </p>
          <Button className="mt-6" onClick={recomecar}>
            Tentar novamente
          </Button>
        </div>
      )}

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
                        {BOOST_CATALOGO[b.tipo]?.nome ?? b.tipo} — {formatDias(b.dias)}
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
