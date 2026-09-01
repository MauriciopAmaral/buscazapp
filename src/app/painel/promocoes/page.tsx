"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, PauseCircle, PlayCircle } from "lucide-react";
import { Button, Modal, Input, Textarea, EmptyState, Badge, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { Promotion, PromotionStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant: Record<PromotionStatus, "success" | "warning" | "outline" | "danger"> = {
  ativa: "success",
  agendada: "warning",
  expirada: "outline",
  desativada: "danger",
};

export default function PromocoesPage() {
  const { token } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/painel/promotions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json?.success) setPromotions(json.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const startNew = () => {
    setEditing({
      id: "",
      companyId: "",
      titulo: "",
      descricao: "",
      imagemUrl: "https://picsum.photos/seed/nova-promo/500/300",
      inicio: new Date().toISOString().slice(0, 10),
      termino: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      preco: 0,
      precoPromocional: 0,
      status: "ativa",
    });
    setOpen(true);
  };

  const save = async (promo: Promotion) => {
    if (!token) return;
    setErro(null);
    const isNew = !promo.id;
    const res = await fetch(isNew ? "/api/painel/promotions" : `/api/painel/promotions/${promo.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(promo),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setErro(json?.error?.message ?? "Não foi possível salvar a promoção.");
      return;
    }
    setPromotions((prev) => {
      const exists = prev.some((p) => p.id === json.data.id);
      return exists ? prev.map((p) => (p.id === json.data.id ? json.data : p)) : [json.data, ...prev];
    });
    setOpen(false);
  };

  const toggleStatus = async (promo: Promotion) => {
    if (!token) return;
    const novoStatus = promo.status === "desativada" ? "ativa" : "desativada";
    const res = await fetch(`/api/painel/promotions/${promo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: novoStatus }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setPromotions((prev) => prev.map((p) => (p.id === promo.id ? json.data : p)));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Promoções</h1>
          <p className="text-sm text-ink-500">Crie promoções por tempo limitado para atrair clientes.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={startNew}>
          Nova promoção
        </Button>
      </div>

      {erro && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      {loading ? (
        <LoadingState className="mt-6" />
      ) : promotions.length === 0 ? (
        <EmptyState className="mt-6" title="Nenhuma promoção cadastrada" action={<Button onClick={startNew}>Criar promoção</Button>} />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
              <div className="relative h-28 w-full bg-ink-100">
                <Image src={p.imagemUrl} alt={p.titulo} fill className="object-cover" unoptimized />
                <span className="absolute right-2 top-2">
                  <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-sm font-semibold text-ink-900">{p.titulo || "Sem título"}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {formatDate(p.inicio)} — {formatDate(p.termino)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-ink-400 line-through">{formatCurrency(p.preco)}</span>
                  <span className="text-sm font-bold text-brand-700">{formatCurrency(p.precoPromocional)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    icon={<Pencil size={14} />}
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStatus(p)}
                    icon={p.status === "desativada" ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.titulo ? "Editar promoção" : "Nova promoção"}>
        {editing && <PromotionForm promotion={editing} onSave={save} />}
      </Modal>
    </div>
  );
}

function PromotionForm({ promotion, onSave }: { promotion: Promotion; onSave: (p: Promotion) => void }) {
  const [form, setForm] = useState(promotion);
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await onSave(form);
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
        rows={3}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Início"
          type="date"
          value={form.inicio.slice(0, 10)}
          onChange={(e) => setForm({ ...form, inicio: e.target.value })}
        />
        <Input
          label="Término"
          type="date"
          value={form.termino.slice(0, 10)}
          onChange={(e) => setForm({ ...form, termino: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Preço"
          type="number"
          step="0.01"
          value={form.preco}
          onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })}
        />
        <Input
          label="Preço promocional"
          type="number"
          step="0.01"
          value={form.precoPromocional}
          onChange={(e) => setForm({ ...form, precoPromocional: Number(e.target.value) })}
        />
      </div>
      <Button type="submit" fullWidth disabled={saving}>
        {saving ? "Salvando..." : "Salvar promoção"}
      </Button>
    </form>
  );
}
