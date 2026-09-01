"use client";

import { useState } from "react";
import Image from "next/image";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Product, Service, Promotion, Coupon, Review } from "@/types";
import { EmptyState } from "@/components/ui";
import { CouponCard, ReviewCard } from "@/components/domain";

const tabs = [
  { key: "produtos", label: "Produtos" },
  { key: "servicos", label: "Serviços" },
  { key: "promocoes", label: "Promoções" },
  { key: "cupons", label: "Cupons" },
  { key: "avaliacoes", label: "Avaliações" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

interface CompanyTabsProps {
  products: Product[];
  services: Service[];
  promotions: Promotion[];
  coupons: Coupon[];
  reviews: Review[];
}

export function CompanyTabs({ products, services, promotions, coupons, reviews }: CompanyTabsProps) {
  const [tab, setTab] = useState<TabKey>("produtos");

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-ink-200 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === "produtos" &&
          (products.length === 0 ? (
            <EmptyState title="Nenhum produto cadastrado" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-xl border border-ink-200 bg-white">
                  <div className="relative h-28 w-full bg-ink-100">
                    <Image src={p.imagemUrl} alt={p.nome} fill className="object-cover" unoptimized />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-medium text-ink-900">{p.nome}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {p.precoPromocional && (
                        <span className="text-xs text-ink-400 line-through">{formatCurrency(p.preco)}</span>
                      )}
                      <span className="text-sm font-semibold text-brand-700">
                        {formatCurrency(p.precoPromocional ?? p.preco)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {tab === "servicos" &&
          (services.length === 0 ? (
            <EmptyState title="Nenhum serviço cadastrado" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {services.map((s) => (
                <div key={s.id} className="flex gap-3 rounded-xl border border-ink-200 bg-white p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    <Image src={s.imagemUrl} alt={s.nome} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{s.nome}</p>
                    <p className="line-clamp-2 text-xs text-ink-500">{s.descricao}</p>
                    <p className="mt-1 text-xs font-medium text-brand-700">
                      A partir de {formatCurrency(s.precoInicial)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {tab === "promocoes" &&
          (promotions.length === 0 ? (
            <EmptyState title="Nenhuma promoção ativa no momento" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {promotions.map((p) => (
                <div key={p.id} className="flex gap-3 rounded-xl border border-ink-200 bg-white p-3">
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    <Image src={p.imagemUrl} alt={p.titulo} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-ink-900">{p.titulo}</p>
                    <p className="line-clamp-2 text-xs text-ink-500">{p.descricao}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-ink-400 line-through">{formatCurrency(p.preco)}</span>
                      <span className="text-sm font-bold text-brand-700">{formatCurrency(p.precoPromocional)}</span>
                    </div>
                    <p className="text-xs text-ink-400">Até {formatDate(p.termino)}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {tab === "cupons" &&
          (coupons.length === 0 ? (
            <EmptyState title="Nenhum cupom disponível" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {coupons.map((c) => (
                <CouponCard key={c.id} coupon={c} />
              ))}
            </div>
          ))}

        {tab === "avaliacoes" &&
          (reviews.length === 0 ? (
            <EmptyState title="Nenhuma avaliação ainda" />
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
