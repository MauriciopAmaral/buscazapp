"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Modal, Input, Textarea, DataTable, Badge } from "@/components/ui";
import { useCurrentCompany } from "@/lib/useCurrentCompany";
import { getCouponsByCompany } from "@/mocks/coupons";
import { Coupon, CouponStatus } from "@/types";
import { cn, formatDate } from "@/lib/utils";

const statusVariant: Record<CouponStatus, "success" | "outline" | "ink" | "danger"> = {
  ativo: "success",
  expirado: "outline",
  utilizado: "ink",
  desativado: "danger",
};

const tabs: { key: CouponStatus | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "ativo", label: "Ativos" },
  { key: "expirado", label: "Expirados" },
  { key: "utilizado", label: "Utilizados" },
];

export default function CuponsPainelPage() {
  const company = useCurrentCompany();
  const [coupons, setCoupons] = useState<Coupon[]>(() => getCouponsByCompany(company.id));
  const [tab, setTab] = useState<CouponStatus | "todos">("todos");
  const [open, setOpen] = useState(false);

  const filtered = tab === "todos" ? coupons : coupons.filter((c) => c.status === tab);

  const create = (coupon: Coupon) => {
    setCoupons((prev) => [coupon, ...prev]);
    setOpen(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Cupons</h1>
          <p className="text-sm text-ink-500">Acompanhe e crie cupons de desconto.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>
          Criar cupom
        </Button>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-ink-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium",
              tab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <DataTable
          data={filtered}
          rowKey={(c) => c.id}
          emptyTitle="Nenhum cupom nesta categoria"
          columns={[
            { key: "titulo", header: "Cupom", render: (c) => <span className="font-medium text-ink-900">{c.titulo}</span> },
            { key: "codigo", header: "Código", render: (c) => <code className="text-xs">{c.codigo}</code> },
            { key: "desconto", header: "Desconto", render: (c) => c.desconto },
            { key: "validade", header: "Validade", render: (c) => formatDate(c.validade) },
            { key: "uso", header: "Uso", render: (c) => `${c.utilizados}/${c.limite}` },
            { key: "status", header: "Status", render: (c) => <Badge variant={statusVariant[c.status]}>{c.status}</Badge> },
          ]}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Criar cupom">
        <CouponForm companyId={company.id} onSave={create} />
      </Modal>
    </div>
  );
}

function CouponForm({ companyId, onSave }: { companyId: string; onSave: (c: Coupon) => void }) {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    codigo: "",
    desconto: "",
    validade: "",
    limite: 50,
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: `new-${Date.now()}`,
          companyId,
          titulo: form.titulo,
          descricao: form.descricao,
          codigo: form.codigo || "NOVOCUPOM",
          desconto: form.desconto,
          validade: form.validade,
          limite: form.limite,
          utilizados: 0,
          status: "ativo",
        });
      }}
    >
      <Input label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
      <Textarea
        label="Descrição"
        value={form.descricao}
        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        rows={2}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} />
        <Input label="Desconto" placeholder="20% OFF" value={form.desconto} onChange={(e) => setForm({ ...form, desconto: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Validade"
          type="date"
          value={form.validade}
          onChange={(e) => setForm({ ...form, validade: e.target.value })}
        />
        <Input
          label="Limite de uso"
          type="number"
          value={form.limite}
          onChange={(e) => setForm({ ...form, limite: Number(e.target.value) })}
        />
      </div>
      <Button type="submit" fullWidth>
        Criar cupom
      </Button>
    </form>
  );
}
