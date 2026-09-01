"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Input, Textarea, Select, Button, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCurrentCompanyLive } from "@/lib/useCurrentCompany";
import { categories } from "@/mocks/categories";
import { HorariosEditor } from "./HorariosEditor";

// Campos que a API já permite editar (PATCH /api/painel/company). Categoria,
// endereço e horário ainda não têm endpoint próprio — ficam visíveis mas
// desabilitados até essa parte do backend existir.
type CamposEditaveis = "nomeFantasia" | "descricao" | "telefone" | "whatsapp" | "email" | "instagram" | "site";

export default function MinhaEmpresaPage() {
  const { token } = useAuth();
  const { company, loading, refresh } = useCurrentCompanyLive();
  const [form, setForm] = useState<Record<CamposEditaveis, string>>({
    nomeFantasia: "",
    descricao: "",
    telefone: "",
    whatsapp: "",
    email: "",
    instagram: "",
    site: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!company) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega o form com os dados da empresa assim que eles chegam da API
    setForm({
      nomeFantasia: company.nomeFantasia,
      descricao: company.descricao,
      telefone: company.telefone,
      whatsapp: company.whatsapp,
      email: company.email ?? "",
      instagram: company.instagram ?? "",
      site: company.site ?? "",
    });
  }, [company]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setErro(null);
    try {
      const res = await fetch("/api/painel/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível salvar as alterações.");
        return;
      }
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Minha empresa</h1>
        <div className="mt-6">
          <LoadingState rows={1} />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Minha empresa</h1>
        <p className="mt-2 text-sm text-red-600">
          Essa conta ainda não está vinculada a uma empresa no banco. Reivindique um perfil ou peça pra um
          administrador vincular sua conta.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Minha empresa</h1>
      <p className="text-sm text-ink-500">Mantenha as informações do seu perfil sempre atualizadas.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6">
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Dados gerais</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nome fantasia"
              value={form.nomeFantasia}
              onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
            />
            <Input label="Razão social" defaultValue={company.razaoSocial} disabled hint="Ainda não editável por aqui" />
            <Input label="CNPJ" defaultValue={company.cnpj} disabled hint="Não pode ser alterado nesta etapa" />
            <div className="flex flex-col gap-1.5">
              <Select label="Categoria" defaultValue={company.categoriaId} disabled>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
              <span className="text-xs text-ink-400">Ainda não editável por aqui</span>
            </div>
          </div>
          <Textarea
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            rows={4}
            className="mt-4"
            containerClassName="w-full"
          />
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Contato</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input label="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            <Input
              label="Site"
              value={form.site}
              onChange={(e) => setForm({ ...form, site: e.target.value })}
              containerClassName="sm:col-span-2"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Endereço</h2>
          <p className="mb-3 text-xs text-ink-400">Ainda não editável por aqui — fale com o suporte pra corrigir.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="CEP" defaultValue={company.endereco.cep} disabled />
            <Input label="Endereço" defaultValue={company.endereco.logradouro} disabled containerClassName="sm:col-span-2" />
            <Input label="Número" defaultValue={company.endereco.numero} disabled />
            <Input label="Complemento" defaultValue={company.endereco.complemento} disabled />
            <Input label="Bairro" defaultValue={company.endereco.bairro} disabled />
            <Input label="Cidade" defaultValue={company.endereco.cidade} disabled />
            <Input label="Estado" defaultValue={company.endereco.estado} disabled />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Horário de funcionamento</h2>
          <p className="mb-3 text-xs text-ink-400">Ainda não editável por aqui.</p>
          <HorariosEditor horarios={company.horarios} />
        </section>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {erro}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" icon={<Save size={16} />} disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
          {saved && <span className="text-sm text-brand-700">Alterações salvas!</span>}
        </div>
      </form>
    </div>
  );
}
