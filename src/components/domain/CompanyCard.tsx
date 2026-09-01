"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, CheckCircle2, Crown, MessageCircle, Heart, Tag, Ticket, Wallet, Utensils } from "lucide-react";
import { Company } from "@/types";
import { Badge } from "@/components/ui";
import { cn, isCompanyOpenNow, whatsappLink } from "@/lib/utils";
import { useFavorites } from "@/context/FavoritesContext";
import { useGeo } from "@/context/GeoContext";
import { distanceKm, formatDistance } from "@/lib/geo";
import { promotions } from "@/mocks/promotions";
import { coupons } from "@/mocks/coupons";

interface CompanyCardProps {
  company: Company;
  className?: string;
}

export function CompanyCard({ company, className }: CompanyCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { coords } = useGeo();
  const aberto = isCompanyOpenNow(company.horarios);
  const favorito = isFavorite(company.id);
  const temPromocao = promotions.some((p) => p.companyId === company.id && p.status === "ativa");
  const temCupom = coupons.some((c) => c.companyId === company.id && c.status === "ativo");
  const distancia = coords
    ? distanceKm(coords, { lat: company.endereco.latitude, lng: company.endereco.longitude })
    : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white transition-shadow hover:shadow-md",
        className
      )}
    >
      {company.patrocinada && (
        <span className="absolute left-3 top-3 z-10">
          <Badge variant="sponsor">PATROCINADO</Badge>
        </span>
      )}
      <button
        onClick={() => toggleFavorite(company.id)}
        aria-label="Favoritar"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-500 shadow-sm hover:text-red-500"
      >
        <Heart size={16} className={cn(favorito && "fill-red-500 text-red-500")} />
      </button>

      <Link href={`/empresa/${company.slug}`} className="relative block h-32 w-full overflow-hidden bg-ink-100">
        <Image
          src={company.capaUrl}
          alt={company.nomeFantasia}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          unoptimized
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-white -mt-8 shadow-sm">
            <Image src={company.logoUrl} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/empresa/${company.slug}`}
              className="line-clamp-1 text-sm font-semibold text-ink-900 hover:text-brand-700"
            >
              {company.nomeFantasia}
            </Link>
            <p className="line-clamp-1 text-xs text-ink-500">{company.categoriaNome}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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
          <Badge variant={aberto ? "success" : "outline"}>{aberto ? "Aberto" : "Fechado"}</Badge>
          {company.clubeParceiro && (
            <Badge variant="warning" icon={<Utensils size={12} />}>
              Clube
            </Badge>
          )}
          {(company.cashbackPercentual ?? 0) > 0 && (
            <Badge variant="success" icon={<Wallet size={12} />}>
              {company.cashbackPercentual}% cashback
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-ink-500">
          <MapPin size={13} />
          <span className="line-clamp-1">
            {company.endereco.bairro}, {company.endereco.cidade}
          </span>
          {distancia !== null && (
            <span className="ml-auto shrink-0 font-medium text-brand-700">{formatDistance(distancia)}</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-ink-700">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          <span className="font-medium">{company.avaliacaoMedia.toFixed(1)}</span>
          <span className="text-ink-400">({company.totalAvaliacoes})</span>
        </div>

        {(temPromocao || temCupom) && (
          <div className="flex flex-wrap gap-1.5">
            {temPromocao && (
              <Badge variant="warning" icon={<Tag size={12} />}>
                Promoção
              </Badge>
            )}
            {temCupom && (
              <Badge variant="danger" icon={<Ticket size={12} />}>
                Cupom
              </Badge>
            )}
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-2">
          <Link
            href={`/empresa/${company.slug}`}
            className="flex-1 rounded-xl border border-ink-200 py-2 text-center text-xs font-semibold text-ink-700 hover:bg-ink-50"
          >
            VER EMPRESA
          </Link>
          <a
            href={whatsappLink(company.whatsapp, `Olá! Vi o perfil de ${company.nomeFantasia} no BuscaZapp.`)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2 text-center text-xs font-semibold text-white hover:bg-[#1fb958]"
          >
            <MessageCircle size={14} />
            WHATSAPP
          </a>
        </div>
      </div>
    </div>
  );
}
