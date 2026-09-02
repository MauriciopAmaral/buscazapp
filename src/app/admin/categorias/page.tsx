"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { DataTable, Badge, Button, Modal, Input, Textarea, LoadingState, SearchInput } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { Category } from "@/types";
import { cn } from "@/lib/utils";

type FiltroStatus = "todas" | "ativas" | "inativas";

export default function AdminCategoriasPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [termo, setTermo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");

  const carregar = () => {
    if (!token) return;
    fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setCategories(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só precisa recarregar quando o token muda
  }, [token]);

  const results = useMemo(() => {
    return categories.filter((c) => {
      if (termo && !c.nome.toLowerCase().includes(termo.toLowerCase())) return false;
      if (filtroStatus === "ativas" && !c.ativo) return false;
      if (filtroStatus === "inativas" && c.ativo) return false;
      return true;
    });
  }, [categories, termo, filtroStatus]);

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

  const excluir = async (cat: Category) => {
    if (!token) return;
    if (!confirm(`Excluir a categoria "${cat.nome}"? Só é possível se nenhuma empresa estiver usando ela.`)) return;
    setExcluindo(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir essa categoria.");
      }
    } finally {
      setExcluindo(null);
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
          <p className="text-sm text-ink-500">{results.length} de {categories.length} categorias.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={startNew}>
          Nova categoria
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SearchInput value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar categoria..." containerClassName="max-w-xs" />
        <div className="flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1">
          {([
            ["todas", "Todas"],
            ["ativas", "Ativas"],
            ["inativas", "Inativas"],
          ] as [FiltroStatus, string][]).map(([valor, label]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltroStatus(valor)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filtroStatus === valor ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            data={results}
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
                    <button onClick={() => toggle(c)} className="text-ink-500 hover:text-brand-700" title={c.ativo ? "Desativar" : "Ativar"}>
                      {c.ativo ? <ToggleRight size={18} className="text-brand-600" /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => excluir(c)}
                      disabled={excluindo === c.id}
                      className="text-ink-500 hover:text-red-600 disabled:opacity-40"
                      title={c.totalEmpresas > 0 ? `Em uso por ${c.totalEmpresas} empresa(s)` : "Excluir"}
                    >
                      <Trash2 size={15} />
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
