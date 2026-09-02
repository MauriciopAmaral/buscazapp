"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { DataTable, Badge, Button, Modal, Input, Textarea, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { Category } from "@/types";

export default function AdminCategoriasPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = () => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setCategories(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const toggle = async (cat: Category) => {
    if (!token) return;
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ativo: !cat.ativo }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? json.data : c)));
    }
  };

  const startNew = () => {
    setEditing({ id: "", slug: "", nome: "", icone: "🏷️", ativo: true, totalEmpresas: 0 });
    setErro(null);
    setOpen(true);
  };

  const save = async (cat: Category) => {
    if (!token) return;
    setErro(null);
    const isNew = !cat.id;
    const res = await fetch(isNew ? "/api/admin/categories" : `/api/admin/categories/${cat.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(cat),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setErro(json?.error?.message ?? "Não foi possível salvar a categoria.");
      return;
    }
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === json.data.id);
      return exists ? prev.map((c) => (c.id === json.data.id ? json.data : c)) : [json.data, ...prev];
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
        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            data={categories}
            rowKey={(c) => c.id}
            columns={[
              {
                key: "nome",
                header: "Categoria",
                render: (c) => (
                  <span className="font-medium text-ink-900">
                    {c.icone} {c.nome}
                  </span>
                ),
              },
              { key: "slug", header: "Slug", render: (c) => <code className="text-xs">{c.slug}</code> },
              { key: "empresas", header: "Empresas", render: (c) => c.totalEmpresas },
              {
                key: "status",
                header: "Status",
                render: (c) => <Badge variant={c.ativo ? "success" : "outline"}>{c.ativo ? "Ativa" : "Inativa"}</Badge>,
              },
              {
                key: "acoes",
                header: "Ações",
                render: (c) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setErro(null);
                        setOpen(true);
                      }}
                      className="text-ink-500 hover:text-brand-700"
                    >
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => toggle(c)} className="text-ink-500 hover:text-brand-700">
                      {c.ativo ? <ToggleRight size={18} className="text-brand-600" /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Editar categoria" : "Nova categoria"}>
        {editing && <CategoryForm category={editing} onSave={save} erro={erro} />}
      </Modal>
    </div>
  );
}

function CategoryForm({
  category,
  onSave,
  erro,
}: {
  category: Category;
  onSave: (c: Category) => Promise<void>;
  erro: string | null;
}) {
  const [form, setForm] = useState(category);
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
      <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
      <Input
        label="Ícone (emoji)"
        value={form.icone}
        onChange={(e) => setForm({ ...form, icone: e.target.value })}
        placeholder="🏷️"
      />
      <Textarea
        label="Descrição (opcional)"
        value={form.descricao ?? ""}
        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        rows={2}
      />
      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}
      <Button type="submit" fullWidth disabled={saving}>
        {saving ? "Salvando..." : "Salvar categoria"}
      </Button>
    </form>
  );
}
