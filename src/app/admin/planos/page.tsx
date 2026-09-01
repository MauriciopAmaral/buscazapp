"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button, Modal, Input } from "@/components/ui";
import { planos as planosMock } from "@/mocks/subscriptions";
import { Plano } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function AdminPlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>(planosMock);
  const [editing, setEditing] = useState<Plano | null>(null);
  const [open, setOpen] = useState(false);

  const save = (plano: Plano) => {
    setPlanos((prev) => prev.map((p) => (p.id === plano.id ? plano : p)));
    setOpen(false);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Planos</h1>
      <p className="text-sm text-ink-500">Gerencie os planos oferecidos às empresas.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planos.map((p) => (
          <div key={p.id} className="rounded-2xl border border-ink-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink-900">{p.nome}</h2>
              <button
                onClick={() => {
                  setEditing(p);
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

      <Modal open={open} onClose={() => setOpen(false)} title={`Editar plano — ${editing?.nome}`}>
        {editing && <PlanForm plano={editing} onSave={save} />}
      </Modal>
    </div>
  );
}

function PlanForm({ plano, onSave }: { plano: Plano; onSave: (p: Plano) => void }) {
  const [form, setForm] = useState(plano);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <Input
        label="Preço mensal"
        type="number"
        step="0.01"
        value={form.precoMensal}
        onChange={(e) => setForm({ ...form, precoMensal: Number(e.target.value) })}
      />
      <Input
        label="Preço trimestral"
        type="number"
        step="0.01"
        value={form.precoTrimestral}
        onChange={(e) => setForm({ ...form, precoTrimestral: Number(e.target.value) })}
      />
      <Input
        label="Preço anual"
        type="number"
        step="0.01"
        value={form.precoAnual}
        onChange={(e) => setForm({ ...form, precoAnual: Number(e.target.value) })}
      />
      <Button type="submit" fullWidth>
        Salvar plano
      </Button>
    </form>
  );
}
