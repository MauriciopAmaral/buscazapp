"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Modal, Input, Textarea, EmptyState } from "@/components/ui";
import { useCurrentCompany } from "@/lib/useCurrentCompany";
import { getServicesByCompany } from "@/mocks/offerings";
import { Service } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function ServicosPage() {
  const company = useCurrentCompany();
  const [services, setServices] = useState<Service[]>(() => getServicesByCompany(company.id));
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const startNew = () => {
    setEditing({
      id: `new-${Date.now()}`,
      companyId: company.id,
      nome: "",
      descricao: "",
      precoInicial: 0,
      imagemUrl: "https://picsum.photos/seed/novo-servico/400/300",
    });
    setOpen(true);
  };

  const save = (service: Service) => {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      return exists ? prev.map((s) => (s.id === service.id ? service : s)) : [service, ...prev];
    });
    setOpen(false);
  };

  const remove = (id: string) => setServices((prev) => prev.filter((s) => s.id !== id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Serviços</h1>
          <p className="text-sm text-ink-500">Cadastre os serviços oferecidos pela sua empresa.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={startNew}>
          Novo serviço
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState className="mt-6" title="Nenhum serviço cadastrado" action={<Button onClick={startNew}>Adicionar serviço</Button>} />
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {services.map((s) => (
            <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                <Image src={s.imagemUrl} alt={s.nome} fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-ink-900">{s.nome || "Sem nome"}</p>
                <p className="line-clamp-1 text-xs text-ink-500">{s.descricao}</p>
                <p className="text-xs font-medium text-brand-700">A partir de {formatCurrency(s.precoInicial)}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={<Pencil size={14} />}
                onClick={() => {
                  setEditing(s);
                  setOpen(true);
                }}
              >
                Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(s.id)} icon={<Trash2 size={14} />} />
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.nome ? "Editar serviço" : "Novo serviço"}>
        {editing && <ServiceForm service={editing} onSave={save} />}
      </Modal>
    </div>
  );
}

function ServiceForm({ service, onSave }: { service: Service; onSave: (s: Service) => void }) {
  const [form, setForm] = useState(service);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
      <Textarea
        label="Descrição"
        value={form.descricao}
        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        rows={3}
      />
      <Input
        label="Preço inicial"
        type="number"
        step="0.01"
        value={form.precoInicial}
        onChange={(e) => setForm({ ...form, precoInicial: Number(e.target.value) })}
      />
      <Button type="submit" fullWidth>
        Salvar serviço
      </Button>
    </form>
  );
}
