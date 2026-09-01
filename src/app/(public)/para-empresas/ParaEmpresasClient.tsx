"use client";

import { useMemo, useState } from "react";
import {
  MessageCircle, Search, Rocket, CheckCircle2, Star, TrendingUp, Users, MapPinned,
  Building2, ChevronDown, Quote,
} from "lucide-react";
import { LinkButton, Select, Badge } from "@/components/ui";
import { companies, cidadesPara } from "@/mocks/companies";
import { categories } from "@/mocks/categories";
import { companyAnalytics } from "@/mocks/analytics";
import { planos } from "@/mocks/subscriptions";
import { formatCurrency, cn } from "@/lib/utils";

function seeded(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const passos = [
  {
    icon: <Building2 size={20} />,
    titulo: "Cadastre sua empresa",
    descricao: "Leva menos de 2 minutos. Sem cartão de crédito pra começar no plano gratuito.",
  },
  {
    icon: <Search size={20} />,
    titulo: "Apareça nas buscas da sua cidade",
    descricao: "Seu perfil entra na busca por categoria, bairro e proximidade — junto de quem já procura o que você vende.",
  },
  {
    icon: <MessageCircle size={20} />,
    titulo: "Receba o cliente direto no WhatsApp",
    descricao: "Sem intermediário, sem comissão por venda. O contato cai direto na sua conversa.",
  },
];

const depoimentos = [
  {
    nome: "Marcos Titan",
    empresa: "Pizzaria Titan",
    cidade: "Belém",
    texto:
      "Desde que reivindiquei o perfil, os pedidos pelo WhatsApp praticamente dobraram. O selo Premium ajudou muito a aparecer primeiro na busca.",
  },
  {
    nome: "Dona da Barbearia Trato Fino",
    empresa: "Barbearia Trato Fino",
    cidade: "Belém",
    texto:
      "Os cupons ativos trazem cliente novo toda semana. E dá pra ver exatamente quantas pessoas clicaram no WhatsApp direto pelo painel.",
  },
  {
    nome: "Studio Beleza & Cia",
    empresa: "Studio Beleza & Cia",
    cidade: "Belém",
    texto:
      "Reivindicar foi rápido e o painel é simples — em uma tarde já tinha fotos, horário e promoção no ar.",
  },
];

const faqs = [
  {
    pergunta: "Preciso pagar pra cadastrar minha empresa?",
    resposta:
      "Não. O plano Gratuito já coloca sua empresa na busca, com perfil básico, até 3 fotos e recebimento de avaliações. Os planos pagos existem pra quem quer destaque e mais recursos.",
  },
  {
    pergunta: "Como o cliente entra em contato comigo?",
    resposta:
      "Direto pelo seu WhatsApp. O BuscaZapp não fica no meio da conversa nem cobra comissão por venda — só ajuda o cliente a te encontrar.",
  },
  {
    pergunta: "Minha empresa já aparece no site, como faço pra assumir o perfil?",
    resposta:
      "Use a opção \"Reivindicar perfil\" na página da sua empresa. Depois de validar (e-mail, telefone ou documento), você ganha acesso ao painel completo.",
  },
  {
    pergunta: "Dá pra cancelar quando quiser?",
    resposta: "Sim, os planos pagos são sem fidelidade — você pode fazer upgrade, downgrade ou cancelar quando quiser pelo painel.",
  },
];

export function ParaEmpresasClient() {
  const [cidade, setCidade] = useState(cidadesPara[0]);
  const [categoriaSlug, setCategoriaSlug] = useState(categories[0]?.slug ?? "");
  const [faqAberto, setFaqAberto] = useState<number | null>(0);

  const totalEmpresas = companies.length;
  const totalCliques = companyAnalytics.reduce((sum, a) => sum + a.cliquesWhatsapp, 0);
  const totalCidades = cidadesPara.length;
  const avaliacaoMedia =
    companies.reduce((sum, c) => sum + c.avaliacaoMedia, 0) / (companies.length || 1);

  const stats = [
    { icon: <Building2 size={18} />, label: "Empresas na plataforma", value: `${totalEmpresas}+` },
    { icon: <MessageCircle size={18} />, label: "Cliques no WhatsApp/mês", value: `${totalCliques.toLocaleString("pt-BR")}+` },
    { icon: <MapPinned size={18} />, label: "Cidades atendidas", value: `${totalCidades}` },
    { icon: <Star size={18} />, label: "Avaliação média", value: avaliacaoMedia.toFixed(1) },
  ];

  const simulacao = useMemo(() => {
    const cidadeIdx = cidadesPara.indexOf(cidade);
    const catIdx = categories.findIndex((c) => c.slug === categoriaSlug);
    const seed = (cidadeIdx + 1) * 31 + (catIdx + 1) * 7;
    const buscasMes = Math.round(800 + seeded(seed) * 4200);
    const cliquesEstimados = Math.round(buscasMes * (0.05 + seeded(seed + 1) * 0.07));
    return { buscasMes, cliquesEstimados };
  }, [cidade, categoriaSlug]);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="brand" icon={<Rocket size={12} />}>
              Para empresas
            </Badge>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-ink-900 sm:text-4xl">
              Sua empresa no WhatsApp de quem já está procurando por você.
            </h1>
            <p className="mt-3 max-w-lg text-sm text-ink-600 sm:text-base">
              Cadastre sua empresa grátis, apareça nas buscas da sua cidade e receba clientes direto no
              seu WhatsApp — sem comissão por venda.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/cadastro?tipo=empresa" size="lg" icon={<Rocket size={18} />}>
                Cadastrar minha empresa grátis
              </LinkButton>
              <LinkButton href="/login" variant="outline" size="lg">
                Já tenho conta
              </LinkButton>
            </div>
            <p className="mt-3 text-xs text-ink-400">Sem cartão de crédito. Leva menos de 2 minutos.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-ink-200 bg-white p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  {s.icon}
                </div>
                <p className="mt-2 text-xl font-bold text-ink-900">{s.value}</p>
                <p className="text-xs text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Como funciona */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-bold text-ink-900 sm:text-2xl">Como funciona</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {passos.map((p, i) => (
            <div key={p.titulo} className="relative rounded-2xl border border-ink-200 bg-white p-5">
              <span className="absolute -top-3 left-5 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                {p.icon}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink-900">{p.titulo}</h3>
              <p className="mt-1 text-xs text-ink-500">{p.descricao}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Simulador de alcance */}
      <div className="bg-ink-50/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-center gap-2 text-ink-500">
            <TrendingUp size={16} />
            <span className="text-sm">Simulador de alcance</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-ink-900 sm:text-2xl">
            Veja quantos clientes você pode alcançar
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-500">
            Estimativa com base no volume de buscas na sua cidade e categoria — os mesmos dados que
            alimentam as estatísticas do painel.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-ink-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <Select label="Sua cidade" value={cidade} onChange={(e) => setCidade(e.target.value)}>
              {cidadesPara.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select label="Sua categoria" value={categoriaSlug} onChange={(e) => setCategoriaSlug(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.nome}
                </option>
              ))}
            </Select>
            <div className="rounded-xl bg-brand-50 p-3 text-center">
              <p className="text-xl font-bold text-brand-700">{simulacao.buscasMes.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-brand-700">buscas estimadas/mês</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">
                {simulacao.cliquesEstimados.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-emerald-700">cliques no WhatsApp/mês</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-400">
            Estimativa ilustrativa do protótipo — os números reais aparecem no seu painel depois do cadastro.
          </p>
        </div>
      </div>

      {/* Planos */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-bold text-ink-900 sm:text-2xl">Planos para todo tamanho de negócio</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className={cn(
                "flex flex-col rounded-2xl border p-5",
                plano.destaque ? "border-brand-500 bg-brand-50/40" : "border-ink-200 bg-white"
              )}
            >
              {plano.destaque && (
                <Badge variant="brand" className="mb-2 w-fit">
                  Mais popular
                </Badge>
              )}
              <p className="text-sm font-semibold text-ink-900">{plano.nome}</p>
              <p className="mt-1 text-2xl font-bold text-ink-900">
                {plano.precoMensal === 0 ? "Grátis" : formatCurrency(plano.precoMensal)}
                {plano.precoMensal > 0 && <span className="text-xs font-normal text-ink-400">/mês</span>}
              </p>
              <ul className="mt-3 flex flex-1 flex-col gap-1.5">
                {plano.recursos.slice(0, 4).map((r) => (
                  <li key={r} className="flex items-start gap-1.5 text-xs text-ink-600">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                    {r}
                  </li>
                ))}
              </ul>
              <LinkButton
                href="/cadastro?tipo=empresa"
                variant={plano.destaque ? "primary" : "outline"}
                size="sm"
                className="mt-4"
                fullWidth
              >
                Começar
              </LinkButton>
            </div>
          ))}
        </div>
      </div>

      {/* Depoimentos */}
      <div className="bg-ink-50/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-bold text-ink-900 sm:text-2xl">Quem já usa recomenda</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {depoimentos.map((d) => (
              <div key={d.nome} className="flex flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-5">
                <Quote size={20} className="text-brand-300" />
                <p className="flex-1 text-sm text-ink-700">“{d.texto}”</p>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{d.nome}</p>
                  <p className="text-xs text-ink-500">
                    {d.empresa} · {d.cidade}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-400">
            Depoimentos ilustrativos com base em empresas fictícias do protótipo.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-bold text-ink-900 sm:text-2xl">Perguntas frequentes</h2>
        <div className="mt-5 flex flex-col divide-y divide-ink-100 rounded-2xl border border-ink-200 bg-white">
          {faqs.map((f, i) => {
            const aberto = faqAberto === i;
            return (
              <div key={f.pergunta}>
                <button
                  onClick={() => setFaqAberto(aberto ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-ink-900">{f.pergunta}</span>
                  <ChevronDown
                    size={16}
                    className={cn("shrink-0 text-ink-400 transition-transform", aberto && "rotate-180")}
                  />
                </button>
                {aberto && <p className="px-5 pb-4 text-sm text-ink-500">{f.resposta}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA final */}
      <div className="bg-ink-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
          <Users size={28} className="text-brand-300" />
          <h2 className="max-w-lg text-xl font-bold text-white sm:text-2xl">
            Comece a receber clientes pelo WhatsApp hoje mesmo.
          </h2>
          <LinkButton href="/cadastro?tipo=empresa" size="lg" icon={<Rocket size={18} />}>
            Cadastrar minha empresa grátis
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
