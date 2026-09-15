"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Utensils, Ticket, Sparkles, CheckCircle2, Calendar } from "lucide-react";
import { CompanyCard } from "@/components/domain";
import { Badge, Button, EmptyState, LoadingState, LinkButton } from "@/components/ui";
import { AssinarClubePagamento } from "@/components/painel/AssinarClubePagamento";
import { useAuth } from "@/context/AuthContext";
import { Company } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const beneficios = [
  {
    icon: <Utensils size={18} />,
    titulo: "Compre 1, leve 2",
    descricao: "Pratos e pizzas em dobro nos restaurantes parceiros, em dias e horários combinados.",
  },
  {
    icon: <Ticket size={18} />,
    titulo: "Cupons exclusivos",
    descricao: "Descontos que só aparecem para quem é assinante do Clube — direto no perfil da empresa.",
  },
  {
    icon: <Sparkles size={18} />,
    titulo: "Novos parceiros toda semana",
    descricao: "A lista de restaurantes cresce conforme mais empresas entram no programa.",
  },
];

interface AssinaturaClube {
  status: "ativa" | "cancelada" | "atrasada";
  valor: number;
  proximaCobranca: string;
}

export default function ClubePage() {
  const { user, token } = useAuth();
  const [partners, setPartners] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [valorMensal, setValorMensal] = useState(0);
  const [assinatura, setAssinatura] = useState<AssinaturaClube | null>(null);
  const [assinando, setAssinando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const carregarAssinatura = useCallback(() => {
    if (!token) return;
    fetch("/api/clube/assinatura", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setAssinatura(json.data.subscription);
      })
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/club/partners")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json?.success) setPartners(json.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetch("/api/clube/plano")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json?.success) setValorMensal(json.data.valorMensal);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    carregarAssinatura();
  }, [carregarAssinatura]);

  const cancelarAssinatura = async () => {
    if (!token) return;
    if (!confirm("Quer mesmo cancelar sua assinatura do Clube? Você mantém acesso até o fim do período já pago.")) return;
    setCancelando(true);
    try {
      const res = await fetch("/api/clube/assinatura/cancelar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) carregarAssinatura();
      else alert(json?.error?.message ?? "Não foi possível cancelar a assinatura.");
    } finally {
      setCancelando(false);
    }
  };

  const assinanteAtivo = assinatura?.status === "ativa";

  return (
    <div>
      <div className="bg-gradient-to-br from-amber-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <Badge variant="warning" icon={<Utensils size={12} />}>
            BuscaZapp Clube
          </Badge>
          <h1 className="mt-3 max-w-xl text-2xl font-bold text-ink-900 sm:text-4xl">
            Compre 1, leve 2 nos melhores restaurantes do Pará.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-600 sm:text-base">
            Assine o Clube e desbloqueie cupons exclusivos de 2x1 e descontos em restaurantes e pizzarias
            parceiros{valorMensal > 0 ? ` por apenas ${formatCurrency(valorMensal)}/mês` : ""}.
          </p>

          <div className="mt-6 max-w-sm">
            {!user ? (
              <div className="flex flex-wrap gap-3">
                <LinkButton href="/login">Entrar pra assinar</LinkButton>
                <Link
                  href="/buscar?categoria=restaurantes"
                  className="self-center text-sm font-medium text-brand-700 hover:underline"
                >
                  Ver todos os restaurantes
                </Link>
              </div>
            ) : assinanteAtivo ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-semibold">Você é assinante do Clube</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                  <Calendar size={13} /> Próxima cobrança em {formatDate(assinatura!.proximaCobranca)}
                </p>
                <button
                  type="button"
                  onClick={cancelarAssinatura}
                  disabled={cancelando}
                  className="mt-2 text-xs font-medium text-ink-500 underline hover:text-ink-700 disabled:opacity-50"
                >
                  {cancelando ? "Cancelando..." : "Cancelar assinatura"}
                </button>
              </div>
            ) : assinando ? (
              <AssinarClubePagamento
                token={token ?? ""}
                onCancelar={() => setAssinando(false)}
                onConcluido={() => {
                  setAssinando(false);
                  carregarAssinatura();
                }}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setAssinando(true)}>
                  {valorMensal > 0 ? `Assinar por ${formatCurrency(valorMensal)}/mês` : "Quero assinar o Clube"}
                </Button>
                <Link
                  href="/buscar?categoria=restaurantes"
                  className="self-center text-sm font-medium text-brand-700 hover:underline"
                >
                  Ver todos os restaurantes
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {beneficios.map((b) => (
            <div key={b.titulo} className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                {b.icon}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink-900">{b.titulo}</h3>
              <p className="mt-1 text-xs text-ink-500">{b.descricao}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-bold text-ink-900">Restaurantes parceiros</h2>
          <p className="mt-1 text-sm text-ink-500">
            {partners.length} empresas oferecem cupons exclusivos do Clube agora.
          </p>
          <div className="mt-4">
            {loading ? (
              <LoadingState />
            ) : partners.length === 0 ? (
              <EmptyState title="Nenhum parceiro ainda" description="Volte em breve para ver os restaurantes do Clube." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((c) => (
                  <CompanyCard key={c.id} company={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
