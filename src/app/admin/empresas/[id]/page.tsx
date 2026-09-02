"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Input, Textarea, Select, Button, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import type { Category, Company } from "@/types";

const NOVA_CATEGORIA = "__nova__";

type CamposTexto =
  | "nomeFantasia"
  | "razaoSocial"
  | "descricao"
  | "telefone"
  | "whatsapp"
  | "email"
  | "instagram"
  | "site"
  | "cep"
  | "logradouro"
  | "numero"
  | "complemento"
  | "bairro"
  | "cidadeNome"
  | "estado";

const CAMPOS_INICIAIS: Record<CamposTexto, string> = {
  nomeFantasia: "",
  razaoSocial: "",
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
  estado: "",
};

export default function AdminEditarEmpresaPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [form, setForm] = useState<Record<CamposTexto, string>>(CAMPOS_INICIAIS);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [status, setStatus] = useState<"ativo" | "pendente" | "suspenso">("pendente");
  const [verificado, setVerificado] = useState(false);
  const [premium, setPremium] = useState(false);
  const [reivindicada, setReivindicada] = useState(false);
  const [planoId, setPlanoId] = useState("gratuito");

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que token/id ficam disponíveis
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/companies/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([companyJson, categoriesJson]) => {
        if (cancelled) return;
        if (categoriesJson?.success) setCategorias(categoriesJson.data);
        if (companyJson?.success) {
          const c: Company = companyJson.data;
          setCompany(c);
          setForm({
            nomeFantasia: c.nomeFantasia,
            razaoSocial: c.razaoSocial,
            descricao: c.descricao,
            telefone: c.telefone,
            whatsapp: c.whatsapp,
            email: c.email ?? "",
            instagram: c.instagram ?? "",
            site: c.site ?? "",
            cep: c.endereco.cep,
            logradouro: c.endereco.logradouro,
            numero: c.endereco.numero,
            complemento: c.endereco.complemento ?? "",
            bairro: c.endereco.bairro,
            cidadeNome: c.endereco.cidade,
            estado: c.endereco.estado,
          });
          setCategoriaId(c.categoriaId);
          setStatus(c.status);
          setVerificado(c.verificado);
          setPremium(c.premium);
          setReivindicada(c.reivindicada);
          setPlanoId(c.planoId);
        } else {
          setErro(companyJson?.error?.message ?? "Empresa não encontrada.");
        }
      })
      .catch(() => setErro("Não foi possível carregar a empresa."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (categoriaId === NOVA_CATEGORIA && !novaCategoriaNome.trim()) {
      setErro("Digite o nome do novo segmento, ou escolha um da lista.");
      return;
    }
    setSaving(true);
    setErro(null);
    try {
      const payload = {
        ...form,
        categoriaId: categoriaId === NOVA_CATEGORIA ? "" : categoriaId,
        novaCategoriaNome: categoriaId === NOVA_CATEGORIA ? novaCategoriaNome.trim() : undefined,
        status,
        verificado,
        premium,
        reivindicada,
        planoId,
      };
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível salvar as alterações.");
        return;
      }
      setCompany(json.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const excluir = async () => {
    if (!token || !company) return;
    if (!confirm(`Excluir "${company.nomeFantasia}" definitivamente? Isso apaga também produtos, cupons, avaliações e todo o resto ligado a ela. Não dá pra desfazer.`)) return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        router.push("/admin/empresas");
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir a empresa.");
        setExcluindo(false);
      }
    } catch {
      setExcluindo(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Editar empresa</h1>
        <div className="mt-6">
          <LoadingState rows={1} />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-3xl">
        <Link href="/admin/empresas" className="flex items-center gap-1 text-sm text-ink-500 hover:underline">
          <ArrowLeft size={14} /> Voltar
        </Link>
        <p className="mt-4 text-sm text-red-600">{erro ?? "Empresa não encontrada."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/empresas" className="flex items-center gap-1 text-sm text-ink-500 hover:underline">
        <ArrowLeft size={14} /> Voltar pra lista de empresas
      </Link>
      <h1 className="mt-2 text-xl font-bold text-ink-900 sm:text-2xl">{company.nomeFantasia}</h1>
      <p className="text-sm text-ink-500">Edição completa, como administrador — inclui status, verificação e plano.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6">
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Situação da empresa</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="ativo">Ativo</option>
              <option value="pendente">Pendente</option>
              <option value="suspenso">Suspenso</option>
            </Select>
            <Select label="Plano" value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
              <option value="gratuito">Gratuito</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
              <option value="premium_plus">Premium Plus</option>
            </Select>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-ink-700">
              <input type="checkbox" checked={verificado} onChange={(e) => setVerificado(e.target.checked)} className="h-4 w-4 rounded border-ink-300" />
              Verificada
            </label>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-ink-700">
              <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} className="h-4 w-4 rounded border-ink-300" />
              Destaque premium
            </label>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-ink-700">
              <input type="checkbox" checked={reivindicada} onChange={(e) => setReivindicada(e.target.checked)} className="h-4 w-4 rounded border-ink-300" />
              Reivindicada
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Dados gerais</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nome fantasia" value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} />
            <Input label="Razão social" value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} />
            <Input label="CNPJ" defaultValue={company.cnpj} disabled hint="Não editável por aqui" />
            <div className="flex flex-col gap-1.5">
              <Select label="Segmento" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
                <option value={NOVA_CATEGORIA}>Não está na lista — cadastrar um novo</option>
              </Select>
              {categoriaId === NOVA_CATEGORIA && (
                <Input
                  placeholder="Nome do segmento (ex: Gráfica)"
                  value={novaCategoriaNome}
                  onChange={(e) => setNovaCategoriaNome(e.target.value)}
                />
              )}
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
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            <Input label="Site" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} containerClassName="sm:col-span-2" />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Endereço</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="CEP" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
            <Input label="Endereço" value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} containerClassName="sm:col-span-2" />
            <Input label="Número" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
            <Input label="Complemento" value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} />
            <Input label="Bairro" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
            <Input label="Cidade" value={form.cidadeNome} onChange={(e) => setForm({ ...form, cidadeNome: e.target.value })} />
            <Input label="Estado (UF)" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} maxLength={2} />
          </div>
        </section>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {erro}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button type="submit" icon={<Save size={16} />} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            {saved && <span className="text-sm text-brand-700">Alterações salvas!</span>}
          </div>
          <Button type="button" variant="danger" icon={<Trash2 size={16} />} disabled={excluindo} onClick={excluir}>
            {excluindo ? "Excluindo..." : "Excluir empresa"}
          </Button>
        </div>
      </form>
    </div>
  );
}
