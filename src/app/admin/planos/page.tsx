"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Button, Modal, Input, Textarea, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { Plano } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function AdminPlanosPage() {
  const { token } = useAuth();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plano | null>(null);
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/plans", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setPlanos(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const save = async (plano: Plano) => {
    if (!token) return { erro: "Sessão expirada." };
    setErro(null);
    const res = await fetch(`/api/admin/plans/${plano.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nome: plano.nome,
        precoMensal: plano.precoMensal,
        precoTrimestral: plano.precoTrimestral,
        precoAnual: plano.precoAnual,
        destaque: plano.destaque ?? false,
        recursos: plano.recursos,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const mensagem = json?.error?.message ?? "Não foi possível salvar o plano.";
      setErro(mensagem);
      return { erro: mensagem };
    }
    setPlanos((prev) => prev.map((p) => (p.id === json.data.id ? json.data : p)));
    setOpen(false);
    return {};
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Planos</h1>
      <p className="text-sm text-ink-500">Gerencie os planos oferecidos às empresas.</p>

      {loading ? (
        <div className="mt-6">
          <LoadingState rows={2} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planos.map((p) => (
            <div key={p.id} className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink-900">{p.nome}</h2>
                <button
                  onClick={() => {
                    setEditing(p);
                    setErro(null);
                    setOpen(true);
                  }}
                  className="text-ink-400 hover:text-brand-600"
                >
                  <Pencil size={15} />
                </button>
              </div>
              <p className="mt-2 text-xl font-bold text-brand-700">{formatCurrency(p.precoMensal)}<span className="text-xs font-normal text-ink-400">/mês</span></p>
              <p className="text-xs text-ink-500">
                {formatCurrency(p.precoTrimestral)} trim. · {formatCurrency(p.precoAnual)} anual
              </p>
              <p className="mt-2 text-xs text-ink-400">{p.assinantes} assinantes</p>
              <ul className="mt-3 flex flex-col gap-1 text-xs text-ink-600">
                {p.recursos.slice(0, 4).map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Editar plano — ${editing?.nome}`}>
        {editing && <PlanForm plano={editing} onSave={save} erro={erro} />}
      </Modal>
    </div>
  );
}

function PlanForm({
  plano,
  onSave,
  erro,
}: {
  plano: Plano;
  onSave: (p: Plano) => Promise<{ erro?: string }>;
  erro: string | null;
}) {
  const [form, setForm] = useState(plano);
  const [recursosTexto, setRecursosTexto] = useState(plano.recursos.join("\n"));
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          const recursos = recursosTexto
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean);
          await onSave({ ...form, recursos });
        } finally {
          setSaving(false);
        }
      }}
    >
      <Input label="Nome do plano" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
      <Input
        label="Preço mensal"
        type="number"
        step="0.01"
        min={0}
        value={form.precoMensal}
        onChange={(e) => setForm({ ...form, precoMensal: Number(e.target.value) })}
      />
      <Input
        label="Preço trimestral"
        type="number"
        step="0.01"
        min={0}
        value={form.precoTrimestral}
        onChange={(e) => setForm({ ...form, precoTrimestral: Number(e.target.value) })}
      />
      <Input
        label="Preço anual"
        type="number"
        step="0.01"
        min={0}
        value={form.precoAnual}
        onChange={(e) => setForm({ ...form, precoAnual: Number(e.target.value) })}
      />
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={form.destaque ?? false}
          onChange={(e) => setForm({ ...form, destaque: e.target.checked })}
          className="h-4 w-4 rounded border-ink-300"
        />
        Plano em destaque (aparece marcado como recomendado)
      </label>
      <Textarea
        label="Recursos (um por linha)"
        value={recursosTexto}
        onChange={(e) => setRecursosTexto(e.target.value)}
        rows={6}
      />
      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}
      <Button type="submit" fullWidth disabled={saving}>
        {saving ? "Salvando..." : "Salvar plano"}
      </Button>
    </form>
  );
}
