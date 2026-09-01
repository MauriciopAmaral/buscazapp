"use client";

import { useState } from "react";
import { Rocket, CheckCircle2, Home, LayoutGrid, MapPin, Star, Tag } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useCurrentCompany } from "@/lib/useCurrentCompany";
import { formatCurrency, cn } from "@/lib/utils";
import { planos } from "@/mocks/subscriptions";
import { Ad } from "@/types";

const opcoes: { tipo: Ad["tipo"]; nome: string; descricao: string; icon: React.ReactNode; precoDia: number }[] = [
  {
    tipo: "destaque_home",
    nome: "Destaque na Home",
    descricao: "Seu perfil aparece na vitrine principal do BuscaZapp.",
    icon: <Home size={18} />,
    precoDia: 6.9,
  },
  {
    tipo: "destaque_categoria",
    nome: "Destaque na categoria",
    descricao: "Fica entre os primeiros resultados da sua categoria.",
    icon: <LayoutGrid size={18} />,
    precoDia: 4.9,
  },
  {
    tipo: "destaque_cidade",
    nome: "Destaque na cidade",
    descricao: "Aparece em destaque para quem busca na sua cidade.",
    icon: <MapPin size={18} />,
    precoDia: 3.9,
  },
  {
    tipo: "resultado_patrocinado",
    nome: "Resultado patrocinado",
    descricao: "Selo \"Patrocinado\" no topo dos resultados de busca.",
    icon: <Star size={18} />,
    precoDia: 5.9,
  },
  {
    tipo: "promocao_destacada",
    nome: "Promoção destacada",
    descricao: "Sua promoção ativa ganha destaque na aba Ofertas.",
    icon: <Tag size={18} />,
    precoDia: 4.4,
  },
];

const duracoes = [7, 15, 30];

export default function ImpulsionarPage() {
  const company = useCurrentCompany();
  const [tipo, setTipo] = useState<Ad["tipo"]>("destaque_home");
  const [dias, setDias] = useState(7);
  const [confirmado, setConfirmado] = useState(false);

  const opcao = opcoes.find((o) => o.tipo === tipo)!;
  const total = opcao.precoDia * dias;

  return (
    <div>
      <div className="flex items-center gap-2 text-ink-500">
        <Rocket size={16} />
        <span className="text-sm">Autoatendimento</span>
      </div>
      <h1 className="mt-1 text-xl font-bold text-ink-900 sm:text-2xl">Impulsionar {company.nomeFantasia}</h1>
      <p className="mt-1 text-sm text-ink-500">
        Escolha um formato de destaque e ative em poucos cliques, sem precisar falar com um vendedor.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {opcoes.map((o) => (
          <button
            key={o.tipo}
            onClick={() => {
              setTipo(o.tipo);
              setConfirmado(false);
            }}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
              tipo === o.tipo ? "border-brand-500 bg-brand-50/60" : "border-ink-200 bg-white hover:border-ink-300"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                tipo === o.tipo ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500"
              )}
            >
              {o.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{o.nome}</p>
              <p className="mt-0.5 text-xs text-ink-500">{o.descricao}</p>
              <p className="mt-1 text-xs font-medium text-brand-700">{formatCurrency(o.precoDia)}/dia</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <p className="text-sm font-semibold text-ink-900">Duração</p>
        <div className="mt-3 inline-flex rounded-xl bg-ink-100 p-1">
          {duracoes.map((d) => (
            <button
              key={d}
              onClick={() => {
                setDias(d);
                setConfirmado(false);
              }}
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
            <p className="text-xs text-ink-500">Total estimado</p>
            <p className="text-2xl font-bold text-ink-900">{formatCurrency(total)}</p>
          </div>
          <Button icon={<Rocket size={16} />} onClick={() => setConfirmado(true)} disabled={confirmado}>
            {confirmado ? "Impulso ativado" : "Ativar impulso"}
          </Button>
        </div>

        {confirmado && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            <span>
              <strong>{opcao.nome}</strong> ativado por {dias} dias. Simulação de checkout — a cobrança real
              acontece quando o pagamento estiver integrado.
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="ink">
          Plano atual: {planos.find((p) => p.id === company.planoId)?.nome ?? company.planoId}
        </Badge>
        <Badge variant="outline">Sem compromisso — cancele quando quiser</Badge>
      </div>
    </div>
  );
}
