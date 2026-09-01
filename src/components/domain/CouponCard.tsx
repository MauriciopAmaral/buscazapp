"use client";

import { useState } from "react";
import { Ticket, Copy, Check, QrCode, Utensils } from "lucide-react";
import { Coupon } from "@/types";
import { Badge, Button, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { companies } from "@/mocks/companies";

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Cupons que vêm da API/banco já trazem o nome da empresa junto (evita ter
  // que procurar no array de mocks, que só tem as empresas fictícias).
  const company = coupon.companySlug
    ? { nomeFantasia: coupon.companyNome ?? "" }
    : companies.find((c) => c.id === coupon.companyId);

  const copy = () => {
    navigator.clipboard?.writeText(coupon.codigo).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-2xl border border-dashed border-brand-300 bg-brand-50/40">
        <div className="flex items-center justify-between p-4 pb-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <Ticket size={14} />
            {company?.nomeFantasia ?? "Empresa"}
          </span>
          <Badge variant="brand">{coupon.desconto}</Badge>
        </div>
        <div className="px-4">
          {coupon.exclusivoClube && (
            <Badge variant="warning" icon={<Utensils size={12} />} className="mb-1.5">
              Exclusivo Clube
            </Badge>
          )}
          <h3 className="text-sm font-semibold text-ink-900">{coupon.titulo}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-ink-500">{coupon.descricao}</p>
          <p className="mt-2 text-xs text-ink-400">Válido até {formatDate(coupon.validade)}</p>
        </div>
        <div className="mt-3 border-t border-dashed border-brand-300 p-3">
          <Button fullWidth size="sm" onClick={() => setOpen(true)} disabled={coupon.status !== "ativo"}>
            {coupon.status === "ativo" ? "Pegar cupom" : "Indisponível"}
          </Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Seu cupom">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-ink-200 bg-white">
            <QrCode size={120} className="text-ink-800" strokeWidth={1} />
          </div>
          <div>
            <p className="text-sm text-ink-500">Código do cupom</p>
            <p className="text-2xl font-bold tracking-widest text-brand-700">{coupon.codigo}</p>
          </div>
          <Button onClick={copy} variant="outline" icon={copied ? <Check size={16} /> : <Copy size={16} />}>
            {copied ? "Copiado!" : "Copiar código"}
          </Button>
          <p className="text-xs text-ink-400">
            Apresente este código ou QR Code fictício no estabelecimento para resgatar sua oferta.
          </p>
        </div>
      </Modal>
    </>
  );
}
