"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  ArrowLeft,
  Mail,
  User2,
  Phone,
} from "lucide-react";
import { Button, Input, LinkButton, LoadingState } from "@/components/ui";
import { useSearchParams } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import { MercadoPagoPaymentBrick } from "@/components/painel/MercadoPagoPaymentBrick";

interface Plano {
  id: string;
  nome: string;
  precoMensal: number;
  precoTrimestral: number;
  precoAnual: number;
  destaque: boolean;
  recursos: string[];
}

type Periodicidade = "mensal" | "trimestral" | "anual";

const LABEL_PERIODO: Record<Periodicidade, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral (3 meses)",
  anual: "Anual (12 meses)",
};

interface PixInfo {
  qrCode: string | null;
  qrCodeBase64: string | null;
}

type Etapa = "dados" | "pagamento" | "sucesso" | "recusado";

const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

export function PlanosComprarClient() {
  const searchParams = useSearchParams();
  const planoIdQuery = searchParams.get("plano") ?? "";

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [carregandoPlanos, setCarregandoPlanos] = useState(true);
  const [planoId, setPlanoId] = useState(planoIdQuery);
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [etapa, setEtapa] = useState<Etapa>("dados");
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [valor, setValor] = useState(0);
  const [pix, setPix] = useState<PixInfo | null>(null);
  const [aguardandoPix, setAguardandoPix] = useState(false);
  const [cadastroToken, setCadastroToken] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/planos")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) {
          setPlanos(json.data);
          if (!planoIdQuery && json.data.length > 0) setPlanoId(json.data[0].id);
        }
      })
      .catch(() => undefined)
      .finally(() => setCarregandoPlanos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Igual ao Impulsionar: enquanto tem um Pix pendente, fica consultando o
  // status a cada 3s — quem confirma de fato é o webhook do Mercado Pago.
  useEffect(() => {
    if (!aguardandoPix || !purchaseId) return;
    const intervalo = setInterval(() => {
      fetch(`/api/planos/${purchaseId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && json.data.status === "pago") {
            setAguardandoPix(false);
            setCadastroToken(json.data.cadastroToken ?? null);
            setEtapa("sucesso");
          } else if (json?.success && json.data.status === "cancelado") {
            setAguardandoPix(false);
            setEtapa("recusado");
          }
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(intervalo);
  }, [aguardandoPix, purchaseId]);

  const planoAtual = planos.find((p) => p.id === planoId);
  const precoPorPeriodo: Record<Periodicidade, number> = planoAtual
    ? { mensal: planoAtual.precoMensal, trimestral: planoAtual.precoTrimestral, anual: planoAtual.precoAnual }
    : { mensal: 0, trimestral: 0, anual: 0 };

  const iniciarPagamento = async () => {
    if (!planoId) return;
    if (!nome.trim() || !email.trim()) {
      setErro("Preencha nome e e-mail.");
      return;
    }
    setCriando(true);
    setErro(null);
    try {
      const res = await fetch("/api/planos/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planoId, periodicidade, nome, email, telefone: telefone || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível iniciar o pagamento.");
        return;
      }
      setPurchaseId(json.data.purchaseId);
      setValor(json.data.valor);
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
    if (!purchaseId) return;
    setErro(null);
    try {
      const res = await fetch(`/api/planos/${purchaseId}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível processar o pagamento.");
        return;
      }
      const data = json.data;
      if (data.status === "pago") {
        setCadastroToken(data.cadastroToken ?? null);
        setEtapa("sucesso");
      } else if (data.pix?.qrCode || data.pix?.qrCodeBase64) {
        setPix(data.pix);
        setAguardandoPix(true);
      } else if (data.status === "cancelado") {
        setEtapa("recusado");
      } else {
        setAguardandoPix(true);
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    }
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

  const recomecar = () => {
    setEtapa("dados");
    setPurchaseId(null);
    setValor(0);
    setPix(null);
    setAguardandoPix(false);
    setErro(null);
  };

  if (carregandoPlanos) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
        <LoadingState rows={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <LinkButton href="/para-empresas" variant="ghost" size="sm" className="mb-4">
        <ArrowLeft size={14} className="mr-1" /> Voltar aos planos
      </LinkButton>

      <div className="flex items-center gap-2 text-ink-500">
        <Rocket size={16} />
        <span className="text-sm">Adquirir plano</span>
      </div>
      <h1 className="mt-1 text-xl font-bold text-ink-900 sm:text-2xl">Contrate seu plano BuscaZapp</h1>
      <p className="mt-1 text-sm text-ink-500">
        Pague com cartão de crédito ou Pix sem sair do site. Depois de aprovado, mandamos um link pro seu e-mail pra
        você completar o cadastro da sua empresa — o plano já entra ativo automaticamente.
      </p>

      {etapa === "dados" && (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
          <p className="text-sm font-semibold text-ink-900">Plano</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {planos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanoId(p.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  planoId === p.id ? "border-brand-500 bg-brand-50/60" : "border-ink-200 bg-white hover:border-ink-300"
                )}
              >
                <p className="text-sm font-semibold text-ink-900">{p.nome}</p>
                <p className="text-xs text-ink-500">{formatCurrency(p.precoMensal)}/mês</p>
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm font-semibold text-ink-900">Periodicidade</p>
          <div className="mt-2 inline-flex flex-wrap rounded-xl bg-ink-100 p-1">
            {(Object.keys(LABEL_PERIODO) as Periodicidade[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodicidade(p)}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  periodicidade === p ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
                )}
              >
                {LABEL_PERIODO[p]}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-ink-100 pt-4">
            <Input
              label="Seu nome"
              icon={<User2 size={16} />}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <Input
              label="E-mail"
              type="email"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              hint="É pra esse e-mail que mandamos o link pra completar o cadastro."
              required
            />
            <Input
              label="WhatsApp (opcional)"
              icon={<Phone size={16} />}
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
            <div>
              <p className="text-xs text-ink-500">Total a pagar</p>
              <p className="text-2xl font-bold text-ink-900">{formatCurrency(precoPorPeriodo[periodicidade])}</p>
            </div>
            <button
              type="button"
              onClick={iniciarPagamento}
              disabled={criando || !planoId}
              className="flex items-center gap-2 rounded-xl bg-[#009EE3] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0087c4] disabled:opacity-60"
            >
              {criando ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
              {criando ? "Preparando pagamento..." : "Continuar para pagamento"}
            </button>
          </div>

          {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
        </div>
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
              <p className="text-sm font-semibold text-ink-900">{planoAtual?.nome}</p>
              <p className="text-xs text-ink-500">{LABEL_PERIODO[periodicidade]}</p>
            </div>
            <p className="text-xl font-bold text-ink-900">{formatCurrency(valor)}</p>
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
              <MercadoPagoPaymentBrick publicKey={publicKey} amount={valor} onSubmit={pagar} onError={setErro} />
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
            Mandamos um e-mail pra <strong>{email}</strong> com o link pra você completar o cadastro da sua empresa.
            Não quer esperar? Pode continuar agora mesmo:
          </p>
          {cadastroToken && (
            <Link
              href={`/cadastro?planoToken=${cadastroToken}&email=${encodeURIComponent(email)}`}
              className="mt-6"
            >
              <Button>Completar cadastro agora</Button>
            </Link>
          )}
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
    </div>
  );
}
