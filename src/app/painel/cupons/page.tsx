"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button, Modal, Input, Textarea, DataTable, Badge, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCurrentCompanyLive } from "@/lib/useCurrentCompany";
import { NoCompanyState } from "@/components/painel/NoCompanyState";
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
  const { token } = useAuth();
  const { company, loading: loadingCompany } = useCurrentCompanyLive();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [tab, setTab] = useState<CouponStatus | "todos">("todos");
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinaliza início do carregamento dos cupons
    setLoadingCoupons(true);
    fetch("/api/painel/coupons", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json?.success) setCoupons(json.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingCoupons(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filtered = tab === "todos" ? coupons : coupons.filter((c) => c.status === tab);

  const create = (coupon: Coupon) => {
    setCoupons((prev) => [coupon, ...prev]);
    setOpen(false);
  };

  if (loadingCompany) return <LoadingState rows={1} />;

  if (!company) {
    return <NoCompanyState />;
  }

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

      {erro && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      <div className="mt-4">
        {loadingCoupons ? (
          <LoadingState rows={1} />
        ) : (
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
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Criar cupom">
        <CouponForm
          token={token}
          onSave={create}
          onError={setErro}
        />
      </Modal>
    </div>
  );
}

function CouponForm({
  token,
  onSave,
  onError,
}: {
  token: string | null;
  onSave: (c: Coupon) => void;
  onError: (msg: string | null) => void;
}) {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    codigo: "",
    desconto: "",
    validade: "",
    limite: 50,
  });
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!token) return;
        setSaving(true);
        onError(null);
        try {
          const res = await fetch("/api/painel/coupons", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...form, codigo: form.codigo || "NOVOCUPOM" }),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok || !json?.success) {
            onError(json?.error?.message ?? "Não foi possível criar o cupom.");
            return;
          }
          onSave(json.data);
        } finally {
          setSaving(false);
        }
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
      <Button type="submit" fullWidth disabled={saving}>
        {saving ? "Criando..." : "Criar cupom"}
      </Button>
    </form>
  );
}
