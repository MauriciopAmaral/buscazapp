"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Input, Textarea, Select, Button } from "@/components/ui";
import { useCurrentCompany } from "@/lib/useCurrentCompany";
import { categories } from "@/mocks/categories";
import { HorariosEditor } from "./HorariosEditor";

export default function MinhaEmpresaPage() {
  const company = useCurrentCompany();
  const [saved, setSaved] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Minha empresa</h1>
      <p className="text-sm text-ink-500">Mantenha as informações do seu perfil sempre atualizadas.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6">
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Dados gerais</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nome fantasia" defaultValue={company.nomeFantasia} />
            <Input label="Razão social" defaultValue={company.razaoSocial} />
            <Input label="CNPJ" defaultValue={company.cnpj} disabled hint="Não pode ser alterado nesta etapa" />
            <Select label="Categoria" defaultValue={company.categoriaId}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
          <Textarea label="Descrição" defaultValue={company.descricao} rows={4} className="mt-4" containerClassName="w-full" />
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Contato</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Telefone" defaultValue={company.telefone} />
            <Input label="WhatsApp" defaultValue={company.whatsapp} />
            <Input label="E-mail" type="email" defaultValue={company.email} />
            <Input label="Instagram" defaultValue={company.instagram} />
            <Input label="Site" defaultValue={company.site} containerClassName="sm:col-span-2" />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Endereço</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="CEP" defaultValue={company.endereco.cep} />
            <Input label="Endereço" defaultValue={company.endereco.logradouro} containerClassName="sm:col-span-2" />
            <Input label="Número" defaultValue={company.endereco.numero} />
            <Input label="Complemento" defaultValue={company.endereco.complemento} />
            <Input label="Bairro" defaultValue={company.endereco.bairro} />
            <Input label="Cidade" defaultValue={company.endereco.cidade} />
            <Input label="Estado" defaultValue={company.endereco.estado} />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Horário de funcionamento</h2>
          <HorariosEditor horarios={company.horarios} />
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" icon={<Save size={16} />}>
            Salvar alterações
          </Button>
          {saved && <span className="text-sm text-brand-700">Alterações salvas (simulação)!</span>}
        </div>
      </form>
    </div>
  );
}
