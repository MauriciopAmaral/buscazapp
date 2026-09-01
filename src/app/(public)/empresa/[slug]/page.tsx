import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2, Crown, Clock, Phone, AtSign, Globe, MessageCircle, Star, Utensils, Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { getCompanyDetailBySlug } from "@/lib/companyData";
import { isCompanyOpenNow, whatsappLink } from "@/lib/utils";
import { ClaimBanner } from "./ClaimBanner";
import { CompanyTabs } from "./CompanyTabs";
import { CompanyMapCard } from "./CompanyMapCard";

// Sem generateStaticParams: a página é renderizada sob demanda (dynamic
// rendering), buscando direto no banco a cada acesso — assim uma empresa
// cadastrada agora aparece sem precisar de um novo build/deploy.

const diaLabel: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyDetailBySlug(slug);
  if (!company) notFound();

  // getCompanyDetailBySlug já filtra produtos ativos, promoções ativas e cupons ativos.
  const products = company.produtos;
  const services = company.servicos;
  const promotions = company.promocoes;
  const coupons = company.cupons;
  const reviews = company.avaliacoes;
  const aberto = isCompanyOpenNow(company.horarios);
  const msg = `Olá! Vi o perfil de ${company.nomeFantasia} no BuscaZapp e gostaria de saber mais.`;

  return (
    <div className="pb-24 lg:pb-10">
      {/* Capa */}
      <div className="relative h-48 w-full bg-ink-200 sm:h-64">
        <Image src={company.capaUrl} alt={company.nomeFantasia} fill className="object-cover" unoptimized priority />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md sm:h-28 sm:w-28">
              <Image src={company.logoUrl} alt="" fill className="object-cover" unoptimized />
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{company.nomeFantasia}</h1>
                {company.verificado && (
                  <Badge variant="brand" icon={<CheckCircle2 size={12} />}>
                    Verificado
                  </Badge>
                )}
                {company.premium && (
                  <Badge variant="gold" icon={<Crown size={12} />}>
                    Premium
                  </Badge>
                )}
                {company.clubeParceiro && (
                  <Badge variant="warning" icon={<Utensils size={12} />}>
                    Parceiro do Clube
                  </Badge>
                )}
              </div>
              <p className="text-sm text-ink-500">{company.categoriaNome}</p>
              <div className="mt-1 flex items-center gap-1 text-sm text-ink-700">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-medium">{company.avaliacaoMedia.toFixed(1)}</span>
                <span className="text-ink-400">({company.totalAvaliacoes} avaliações)</span>
              </div>
            </div>
          </div>

          <a
            href={whatsappLink(company.whatsapp, msg)}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#1fb958] lg:flex"
          >
            <MessageCircle size={18} />
            CHAMAR NO WHATSAPP
          </a>
        </div>

        {!company.reivindicada && (
          <div className="mt-6">
            <ClaimBanner companySlug={company.slug} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-sm leading-relaxed text-ink-700">{company.descricao}</p>

            {/* Galeria */}
            <div className="mt-5 grid grid-cols-4 gap-2">
              {company.galeria.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-ink-100">
                  <Image src={img} alt="" fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>

            <div className="mt-8">
              <CompanyTabs products={products} services={services} promotions={promotions} coupons={coupons} reviews={reviews} />
            </div>
          </div>

          {/* Sidebar info */}
          <aside className="flex flex-col gap-4">
            <CompanyMapCard endereco={company.endereco} nomeFantasia={company.nomeFantasia} />

            {(company.cashbackPercentual ?? 0) > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    {company.cashbackPercentual}% de cashback
                  </p>
                  <p className="text-xs text-emerald-700">
                    Receba parte do valor de volta em compras nesta empresa.
                  </p>
                </div>
              </div>
            )}

            {company.clubeParceiro && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Utensils size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Parceiro do BuscaZapp Clube</p>
                  <p className="text-xs text-amber-700">
                    Assinantes têm cupons exclusivos aqui.{" "}
                    <Link href="/clube" className="underline hover:text-amber-900">
                      Saiba mais
                    </Link>
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-ink-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
                <Clock size={16} className="text-ink-400" />
                Horário de funcionamento
                <Badge variant={aberto ? "success" : "outline"} className="ml-auto">
                  {aberto ? "Aberto agora" : "Fechado"}
                </Badge>
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-xs text-ink-600">
                {company.horarios.map((h) => (
                  <li key={h.dia} className="flex justify-between">
                    <span>{diaLabel[h.dia]}</span>
                    <span className={h.aberto ? "" : "text-ink-400"}>
                      {h.aberto ? `${h.inicio} - ${h.fim}` : "Fechado"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-4">
              <div className="text-sm font-medium text-ink-800">Contato</div>
              <div className="mt-2 flex flex-col gap-2 text-sm text-ink-600">
                <span className="flex items-center gap-2">
                  <Phone size={15} className="text-ink-400" /> {company.telefone}
                </span>
                {company.instagram && (
                  <span className="flex items-center gap-2">
                    <AtSign size={15} className="text-ink-400" /> {company.instagram}
                  </span>
                )}
                {company.site && (
                  <a href={company.site} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-700">
                    <Globe size={15} className="text-ink-400" /> {company.site.replace("https://", "")}
                  </a>
                )}
              </div>
            </div>

            <Link
              href={`/reivindicar/${company.slug}`}
              className="text-center text-xs text-ink-400 hover:text-brand-600 hover:underline"
            >
              {company.reivindicada ? "Encontrou uma informação errada? Fale conosco." : "É dono desta empresa? Reivindique o perfil."}
            </Link>
          </aside>
        </div>
      </div>

      {/* CTA mobile fixo */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white p-3 lg:hidden">
        <a
          href={whatsappLink(company.whatsapp, msg)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md"
        >
          <MessageCircle size={18} />
          CHAMAR NO WHATSAPP
        </a>
      </div>
    </div>
  );
}
