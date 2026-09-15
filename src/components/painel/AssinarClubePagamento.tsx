"use client";

// ============================================================
// Fluxo de pagamento da assinatura do BuscaZapp Clube (consumidor final).
// Mesmo espírito do TrocarPlanoPagamento (Painel → Assinatura da empresa):
// dispara a criação do pagamento assim que aparece na tela, mesmo Payment
// Brick embutido (cartão ou Pix) e a mesma tela de verificação de ~10s pro
// cartão, pra nunca confiar cegamente na resposta imediata do pagamento.
// Só que aqui não tem plano/periodicidade pra escolher — é um valor fixo
// mensal só (vem de GET /api/clube/plano).
// ============================================================

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, CheckCircle2, XCircle, Clock, Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { MercadoPagoPaymentBrick } from "@/components/painel/MercadoPagoPaymentBrick";

const DURACAO_MINIMA_VERIFICACAO_MS = 10000;
const INTERVALO_VERIFICACAO_MS = 2000;
const TENTATIVAS_MAX_VERIFICACAO = 8;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PixInfo {
  qrCode: string | null;
  qrCodeBase64: string | null;
}

type Etapa = "confirmando" | "pagamento" | "verificando" | "sucesso" | "recusado";

const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

interface Props {
  token: string;
  onConcluido: () => void;
  onCancelar: () => void;
}

export function AssinarClubePagamento({ token, onConcluido, onCancelar }: Props) {
  const [etapa, setEtapa] = useState<Etapa>("confirmando");
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [valor, setValor] = useState(0);
  const [pix, setPix] = useState<PixInfo | null>(null);
  const [aguardandoIndefinido, setAguardandoIndefinido] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const iniciar = async () => {
    setCriando(true);
    setErro(null);
    try {
      const res = await fetch("/api/clube/assinar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível iniciar a assinatura do Clube.");
        return;
      }
      setPurchaseId(json.data.purchaseId);
      setValor(json.data.valor);
      setEtapa("pagamento");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCriando(false);
    }
  };

  // Dispara a criação da cobrança assim que o componente aparece — vai
  // direto pro método de pagamento, sem clique extra.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara a cobrança assim que o componente monta com um token válido
    if (token) void iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só dispara uma vez, quando o componente monta com um token válido
  }, [token]);

  const verificar = async (id: string) => {
    const inicio = Date.now();
    let confirmado = false;
    let cancelado = false;

    for (let tentativa = 0; tentativa < TENTATIVAS_MAX_VERIFICACAO && !confirmado && !cancelado; tentativa++) {
      await sleep(INTERVALO_VERIFICACAO_MS);
      try {
        const res = await fetch(`/api/clube/assinar/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (json?.success) {
          if (json.data.status === "pago") confirmado = true;
          else if (json.data.status === "cancelado") cancelado = true;
        }
      } catch {
        // tenta de novo na próxima volta
      }
    }

    const decorrido = Date.now() - inicio;
    if (decorrido < DURACAO_MINIMA_VERIFICACAO_MS) await sleep(DURACAO_MINIMA_VERIFICACAO_MS - decorrido);

    if (cancelado) setEtapa("recusado");
    else if (confirmado) setEtapa("sucesso");
    else setAguardandoIndefinido(true); // raro (ex: cartão em análise) — continua consultando sem prazo
  };

  const pagar = async (formData: Record<string, unknown>) => {
    if (!purchaseId) return;
    setErro(null);
    try {
      const res = await fetch(`/api/clube/assinar/${purchaseId}/pagar`, {
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
      if (data.pix?.qrCode || data.pix?.qrCodeBase64) {
        setPix(data.pix);
        setAguardandoIndefinido(true);
      } else if (data.status === "cancelado") {
        setEtapa("recusado");
      } else {
        setEtapa("verificando");
        void verificar(purchaseId);
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

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      {etapa === "confirmando" && (
        <>
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-700"
          >
            <ArrowLeft size={14} /> Cancelar
          </button>
          <div className="mt-4 flex flex-col items-center py-4 text-center">
            {criando && <Loader2 size={22} className="mb-3 animate-spin text-brand-600" />}
            <p className="text-sm text-ink-500">Preparando pagamento da</p>
            <p className="text-lg font-bold text-ink-900">Assinatura BuscaZapp Clube</p>
          </div>
          {erro && (
            <div className="text-center">
              <p className="text-sm text-red-600">{erro}</p>
              <Button className="mt-3" variant="outline" onClick={iniciar}>
                Tentar de novo
              </Button>
            </div>
          )}
        </>
      )}

      {etapa === "pagamento" && (
        <>
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-700"
          >
            <ArrowLeft size={14} /> Cancelar
          </button>
          <div className="mt-3 flex items-center justify-between gap-3 border-b border-ink-100 pb-4">
            <p className="text-sm font-semibold text-ink-900">Assinatura BuscaZapp Clube — mensal</p>
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
              <ClubePurchaseWaiter
                purchaseId={purchaseId}
                token={token}
                onConfirmado={() => setEtapa("sucesso")}
                onCancelado={() => setEtapa("recusado")}
              />
            </div>
          ) : (
            <div className="mt-4">
              <MercadoPagoPaymentBrick publicKey={publicKey} amount={valor} onSubmit={pagar} onError={setErro} />
            </div>
          )}

          {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
        </>
      )}

      {etapa === "verificando" && (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Loader2 size={26} className="animate-spin" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-ink-900">Verificando seu pagamento...</h3>
          <p className="mt-1 max-w-xs text-sm text-ink-500">
            Estamos confirmando com o Mercado Pago se o pagamento foi mesmo concluído.
          </p>
          {aguardandoIndefinido && (
            <ClubePurchaseWaiter
              purchaseId={purchaseId}
              token={token}
              onConfirmado={() => setEtapa("sucesso")}
              onCancelado={() => setEtapa("recusado")}
            />
          )}
        </div>
      )}

      {etapa === "sucesso" && (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={26} />
          </span>
          <h3 className="mt-4 text-lg font-bold text-ink-900">Assinatura confirmada!</h3>
          <p className="mt-1 text-sm text-ink-500">
            Você já tem acesso aos cupons exclusivos do BuscaZapp Clube.
          </p>
          <Button className="mt-5" onClick={onConcluido}>
            Ok, entendi
          </Button>
        </div>
      )}

      {etapa === "recusado" && (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle size={26} />
          </span>
          <h3 className="mt-4 text-lg font-bold text-ink-900">Pagamento não aprovado</h3>
          <p className="mt-1 text-sm text-ink-500">Nenhuma cobrança foi feita. Pode tentar de novo quando quiser.</p>
          <Button className="mt-5" onClick={onCancelar}>
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
}

/** Fica consultando o status a cada 3s enquanto tem um Pix pendente — igual
 * ao Impulsionar/Planos/Assinatura de empresa. */
function ClubePurchaseWaiter({
  purchaseId,
  token,
  onConfirmado,
  onCancelado,
}: {
  purchaseId: string | null;
  token: string;
  onConfirmado: () => void;
  onCancelado: () => void;
}) {
  useEffect(() => {
    if (!purchaseId) return;
    const intervalo = setInterval(() => {
      fetch(`/api/clube/assinar/${purchaseId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && json.data.status === "pago") {
            clearInterval(intervalo);
            onConfirmado();
          } else if (json?.success && json.data.status === "cancelado") {
            clearInterval(intervalo);
            onCancelado();
          }
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onConfirmado/onCancelado são recriadas a cada render; só precisa reagir a mudanças de purchaseId/token
  }, [purchaseId, token]);
  return (
    <p className="mt-4 flex items-center gap-2 text-xs text-ink-400">
      <Loader2 size={13} className="animate-spin" /> Aguardando confirmação — atualiza sozinho assim que o Pix for
      pago.
    </p>
  );
}
