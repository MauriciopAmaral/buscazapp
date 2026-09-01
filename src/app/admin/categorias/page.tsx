"use client";

import { useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { DataTable, Badge, Button, Modal, Input } from "@/components/ui";
import { categories as categoriesMock } from "@/mocks/categories";
import { Category } from "@/types";

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>(categoriesMock);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const toggle = (id: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c)));
  };

  const startNew = () => {
    setEditing({ id: `new-${Date.now()}`, slug: "", nome: "", icone: "store", ativo: true, totalEmpresas: 0 });
    setOpen(true);
  };

  const save = (cat: Category) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === cat.id);
      return exists ? prev.map((c) => (c.id === cat.id ? cat : c)) : [cat, ...prev];
    });
    setOpen(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Categorias</h1>
          <p className="text-sm text-ink-500">Gerencie as categorias exibidas na plataforma.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={startNew}>
          Nova categoria
        </Button>
      </div>

      <div className="mt-4">
        <DataTable
          data={categories}
          rowKey={(c) => c.id}
          columns={[
            { key: "nome", header: "Categoria", render: (c) => <span className="font-medium text-ink-900">{c.nome}</span> },
            { key: "slug", header: "Slug", render: (c) => <code className="text-xs">{c.slug}</code> },
            { key: "empresas", header: "Empresas", render: (c) => c.totalEmpresas },
            { key: "status", header: "Status", render: (c) => <Badge variant={c.ativo ? "success" : "outline"}>{c.ativo ? "Ativa" : "Inativa"}</Badge> },
            {
              key: "acoes",
              header: "Ações",
              render: (c) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                    className="text-ink-500 hover:text-brand-700"
                  >
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => toggle(c.id)} className="text-ink-500 hover:text-brand-700">
                    {c.ativo ? <ToggleRight size={18} className="text-brand-600" /> : <ToggleLeft size={18} />}
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.nome ? "Editar categoria" : "Nova categoria"}>
        {editing && <CategoryForm category={editing} onSave={save} />}
      </Modal>
    </div>
  );
}

function CategoryForm({ category, onSave }: { category: Category; onSave: (c: Category) => void }) {
  const [form, setForm] = useState(category);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
      <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
      <Button type="submit" fullWidth>
        Salvar categoria
      </Button>
    </form>
  );
}
