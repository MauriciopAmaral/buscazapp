"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button, Input, LoadingState, Select, Textarea } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCurrentCompanyLive } from "@/lib/useCurrentCompany";
import type { Category, User } from "@/types";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface FormState {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  categoriaId: string;
  descricao: string;
  telefone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  site: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidadeNome: string;
  estado: string;
}

const INITIAL_STATE: FormState = {
  nomeFantasia: "",
  razaoSocial: "",
  cnpj: "",
  categoriaId: "",
  descricao: "",
  telefone: "",
  whatsapp: "",
  email: "",
  instagram: "",
  site: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidadeNome: "",
  estado: "PA",
};

export default function CriarEmpresaPage() {
  const router = useRouter();
  const { token, setSession } = useAuth();
  const { company, loading: loadingCompany } = useCurrentCompanyLive();
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.success) setCategorias(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCategorias(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Já tem empresa vinculada — não faz sentido criar outra, manda pro dashboard.
  useEffect(() => {
    if (!loadingCompany && company) {
      router.replace("/painel");
    }
  }, [loadingCompany, company, router]);

  const setField = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/painel/company/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível cadastrar a empresa.");
        return;
      }
      setSession(json.data.token, json.data.user as User);
      router.push("/painel");
    } catch {
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (loadingCompany || company) {
    return (
      <div className="max-w-3xl">
        <LoadingState rows={3} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <Building2 size={20} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Cadastrar minha empresa</h1>
          <p className="text-sm text-ink-500">
            Preencha os dados abaixo — seu perfil vai pro ar assim que você salvar.
          </p>
        </div>
      </div>

      <form className="mt-6 flex flex-col gap-6" onSubmit={handleSubmit}>
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Dados da empresa</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome fantasia(OPCIONAL)" value={form.nomeFantasia} onChange={setField("nomeFantasia")} required />
            <Input label="Razão social ou CPF" value={form.razaoSocial} onChange={setField("razaoSocial")} required />
            <Input
              label="CNPJ"
              value={form.cnpj}
              onChange={setField("cnpj")}
              placeholder="00.000.000/0000-00"
              required
            />
            <Select
              label="Categoria"
              value={form.categoriaId}
              onChange={setField("categoriaId")}
              required
              disabled={loadingCategorias}
            >
              <option value="">{loadingCategorias ? "Carregando..." : "Selecione"}</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            label="Descrição"
            value={form.descricao}
            onChange={setField("descricao")}
            className="mt-4"
            rows={4}
            placeholder="Conte pros clientes o que sua empresa faz."
            required
          />
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Contato</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Telefone" value={form.telefone} onChange={setField("telefone")} required />
            <Input label="WhatsApp" value={form.whatsapp} onChange={setField("whatsapp")} required />
            <Input label="E-mail (opcional)" type="email" value={form.email} onChange={setField("email")} />
            <Input label="Instagram (opcional)" value={form.instagram} onChange={setField("instagram")} />
            <Input label="Site (opcional)" value={form.site} onChange={setField("site")} />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Endereço</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="CEP" value={form.cep} onChange={setField("cep")} required />
            <Input label="Logradouro" value={form.logradouro} onChange={setField("logradouro")} required />
            <Input label="Número" value={form.numero} onChange={setField("numero")} required />
            <Input label="Complemento (opcional)" value={form.complemento} onChange={setField("complemento")} />
            <Input label="Bairro" value={form.bairro} onChange={setField("bairro")} required />
            <Input label="Cidade" value={form.cidadeNome} onChange={setField("cidadeNome")} required />
            <Select label="Estado" value={form.estado} onChange={setField("estado")} required>
              {ESTADOS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </div>
        </section>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {erro}
          </p>
        )}

        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Cadastrar empresa"}
        </Button>
      </form>
    </div>
  );
}
