"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { Button, LinkButton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BOOST_CATALOGO, BoostTipo } from "@/lib/boostCatalog";

interface BoostRow {
  id: string;
  tipo: BoostTipo;
  dias: number;
  valor: number | string;
  status: "pendente" | "pago" | "cancelado" | "expirado";
  ad?: { termino: string } | null;
}

// Pra onde o Mercado Pago manda a empresa de volta depois do pagamento
// (aprovado, pendente ou recusado). O pagamento em si já foi processado
// pelo webhook (POST /api/webhooks/mercadopago) — essa tela só fica
// perguntando o status a cada poucos segundos até saber o resultado, já
// que o webhook às vezes demora alguns segundos a mais que o redirecionamento.
export function ImpulsionarRetornoClient() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const boostId = searchParams.get("boost");

  const [boost, setBoost] = useState<BoostRow | null>(null);
  const [tentativas, setTentativas] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !boostId) return;
    let cancelado = false;

    const consultar = () => {
      fetch(`/api/painel/boosts/${boostId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => {
          if (cancelado) return;
          if (json?.success) {
            setBoost(json.data);
          } else {
            setErro(json?.error?.message ?? "Não foi possível consultar o pagamento.");
          }
        })
        .catch(() => {
          if (!cancelado) setErro("Não foi possível conectar ao servidor.");
        })
        .finally(() => {
          if (!cancelado) setTentativas((t) => t + 1);
        });
    };

    consultar();

    return () => {
      cancelado = true;
    };
  }, [token, boostId]);

  // Continua consultando a cada 3s enquanto o pagamento ainda está
  // "pendente" (o webhook pode levar alguns segundos), até no máximo ~10 tentativas.
  useEffect(() => {
    if (!token || !boostId || !boost) return;
    if (boost.status !== "pendente" || tentativas >= 10) return;
    const timeout = setTimeout(() => {
      fetch(`/api/painel/boosts/${boostId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => {
          if (json?.success) setBoost(json.data);
        })
        .catch(() => undefined)
        .finally(() => setTentativas((t) => t + 1));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [token, boostId, boost, tentativas]);

  if (!boostId) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="text-sm text-ink-500">Nenhum pagamento pra consultar.</p>
        <LinkButton href="/painel/impulsionar" className="mt-4">
          Voltar pro Impulsionar
        </LinkButton>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="text-sm text-red-600">{erro}</p>
        <LinkButton href="/painel/impulsionar" className="mt-4">
          Voltar pro Impulsionar
        </LinkButton>
      </div>
    );
  }

  if (!boost) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
        <Loader2 size={28} className="animate-spin text-ink-400" />
        <p className="mt-3 text-sm text-ink-500">Consultando o pagamento...</p>
      </div>
    );
  }

  const catalogo = BOOST_CATALOGO[boost.tipo];

  if (boost.status === "pago") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={30} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-ink-900">Pagamento aprovado!</h1>
        <p className="mt-2 text-sm text-ink-500">
          <strong>{catalogo?.nome}</strong> por {boost.dias} dias, {formatCurrency(Number(boost.valor))} — já está
          ativo{boost.ad && <> até {formatDate(boost.ad.termino)}</>}.
        </p>
        <LinkButton href="/painel/impulsionar" className="mt-6">
          Ver meus impulsionamentos
        </LinkButton>
      </div>
    );
  }

  if (boost.status === "cancelado") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <XCircle size={30} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-ink-900">Pagamento não aprovado</h1>
        <p className="mt-2 text-sm text-ink-500">
          O pagamento de <strong>{catalogo?.nome}</strong> não foi concluído. Nenhuma cobrança foi feita — pode
          tentar de novo quando quiser.
        </p>
        <LinkButton href="/painel/impulsionar" className="mt-6">
          Tentar novamente
        </LinkButton>
      </div>
    );
  }

  // pendente / expirado
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Clock size={30} />
      </span>
      <h1 className="mt-5 text-xl font-bold text-ink-900">Aguardando confirmação do pagamento</h1>
      <p className="mt-2 text-sm text-ink-500">
        Pix costuma confirmar em segundos e cartão na hora — se você pagou por boleto, pode levar até 3 dias úteis.
        Assim que o Mercado Pago confirmar, o impulsionamento é ativado sozinho, sem precisar fazer nada aqui.
      </p>
      {tentativas < 10 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-400">
          <Loader2 size={13} className="animate-spin" /> Verificando automaticamente...
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Link href="/painel/impulsionar">
          <Button variant="outline">Ver histórico</Button>
        </Link>
      </div>
    </div>
  );
}
