"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Utensils, Ticket, CheckCircle2, Sparkles } from "lucide-react";
import { CompanyCard } from "@/components/domain";
import { Badge, Button, EmptyState, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { Company } from "@/types";

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

export default function ClubePage() {
  const { user, loginAs } = useAuth();
  const [partners, setPartners] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const isAssinante = !!user && (user.clubeAssinante ?? false);

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
    return () => {
      cancelled = true;
    };
  }, []);

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
            parceiros — sem taxa de adesão neste protótipo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {isAssinante ? (
              <Badge variant="success" icon={<CheckCircle2 size={14} />} className="px-4 py-2 text-sm">
                Você já é assinante do Clube
              </Badge>
            ) : (
              <Button onClick={() => loginAs("consumidor")}>Quero assinar o Clube</Button>
            )}
            <Link href="/buscar?categoria=restaurantes" className="self-center text-sm font-medium text-brand-700 hover:underline">
              Ver todos os restaurantes
            </Link>
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

        <p className="mt-10 text-xs text-ink-400">
          O BuscaZapp Clube é um protótipo: hoje a assinatura é simulada (login de demonstração) e os
          cupons 2x1 não envolvem cobrança real. Quando o backend entrar em produção, a assinatura passa
          a ter cobrança recorrente de verdade.
        </p>
      </div>
    </div>
  );
}
