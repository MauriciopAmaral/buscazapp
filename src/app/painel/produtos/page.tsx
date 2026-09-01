"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Modal, Input, Textarea, EmptyState, Badge } from "@/components/ui";
import { useCurrentCompany } from "@/lib/useCurrentCompany";
import { getProductsByCompany } from "@/mocks/offerings";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function ProdutosPage() {
  const company = useCurrentCompany();
  const [products, setProducts] = useState<Product[]>(() => getProductsByCompany(company.id));
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const startNew = () => {
    setEditing({
      id: `new-${Date.now()}`,
      companyId: company.id,
      imagemUrl: "https://picsum.photos/seed/novo-produto/400/300",
      nome: "",
      descricao: "",
      preco: 0,
      ativo: true,
    });
    setOpen(true);
  };

  const save = (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
    });
    setOpen(false);
  };

  const remove = (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Produtos</h1>
          <p className="text-sm text-ink-500">Gerencie o catálogo de produtos exibido no seu perfil.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={startNew}>
          Novo produto
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState className="mt-6" title="Nenhum produto cadastrado" action={<Button onClick={startNew}>Adicionar produto</Button>} />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
              <div className="relative h-32 w-full bg-ink-100">
                <Image src={p.imagemUrl} alt={p.nome} fill className="object-cover" unoptimized />
                <span className="absolute right-2 top-2">
                  <Badge variant={p.ativo ? "success" : "outline"}>{p.ativo ? "Ativo" : "Inativo"}</Badge>
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-sm font-semibold text-ink-900">{p.nome || "Sem nome"}</p>
                <p className="mt-1 line-clamp-2 text-xs text-ink-500">{p.descricao}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {p.precoPromocional && (
                    <span className="text-xs text-ink-400 line-through">{formatCurrency(p.preco)}</span>
                  )}
                  <span className="text-sm font-bold text-brand-700">{formatCurrency(p.precoPromocional ?? p.preco)}</span>
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
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)} icon={<Trash2 size={14} />} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.nome ? "Editar produto" : "Novo produto"}>
        {editing && <ProductForm product={editing} onSave={save} />}
      </Modal>
    </div>
  );
}

function ProductForm({ product, onSave }: { product: Product; onSave: (p: Product) => void }) {
  const [form, setForm] = useState(product);
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
          value={form.precoPromocional ?? ""}
          onChange={(e) => setForm({ ...form, precoPromocional: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={form.ativo}
          onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
          className="h-4 w-4 accent-brand-600"
        />
        Produto ativo
      </label>
      <Button type="submit" fullWidth>
        Salvar produto
      </Button>
    </form>
  );
}
