"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Star, MapPinned, LocateFixed, LoaderCircle } from "lucide-react";
import { CompanyCard } from "@/components/domain";
import { FilterBar, Select, EmptyState, Pagination, SearchInput, Button, LoadingState } from "@/components/ui";
import { neighborhoods, cities } from "@/mocks/locations";
import { isCompanyOpenNow, normalizeForCompare } from "@/lib/utils";
import { useGeo } from "@/context/GeoContext";
import { distanceKm } from "@/lib/geo";
import { Category, Company, Coupon, Promotion } from "@/types";

const PAGE_SIZE = 9;

export function BuscarClient() {
  const searchParams = useSearchParams();
  const [termo, setTermo] = useState(searchParams.get("q") ?? "");
  const [cidade, setCidade] = useState(searchParams.get("cidade") ?? "");
  const [bairro, setBairro] = useState("");
  const [categoria, setCategoria] = useState(searchParams.get("categoria") ?? "");
  const [avaliacao, setAvaliacao] = useState("");
  const [abertoAgora, setAbertoAgora] = useState(false);
  const [comOfertas, setComOfertas] = useState(false);
  const [comCupons, setComCupons] = useState(false);
  const [ordenacao, setOrdenacao] = useState("relevancia");
  const [page, setPage] = useState(1);
  const { coords, status, requestLocation } = useGeo();

  // Dados reais do banco, buscados uma vez na API — o filtro/ordenação abaixo
  // continua rodando no navegador em cima desse conjunto, igual antes com os
  // mocks. Bairros/cidades pro dropdown de filtro ainda vêm de src/mocks/locations
  // (não existe endpoint de bairros/cidades na API ainda).
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      setLoadingDados(true);
      try {
        const [resCompanies, resCategories, resPromotions, resCoupons] = await Promise.all([
          fetch("/api/companies?pageSize=50").then((r) => r.json()),
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/promotions").then((r) => r.json()),
          fetch("/api/coupons").then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (resCompanies?.success) setCompanies(resCompanies.data.empresas);
        if (resCategories?.success) setCategories(resCategories.data);
        if (resPromotions?.success) setPromotions(resPromotions.data);
        if (resCoupons?.success) setCoupons(resCoupons.data);
      } catch {
        // sem conexão: mantém listas vazias
      } finally {
        if (!cancelled) setLoadingDados(false);
      }
    }
    carregar();
    return () => {
      cancelled = true;
    };
  }, []);

  // Junta cidades "iguais" digitadas com acento/maiúscula diferente (ex:
  // "Belém" e "belem") num único item no dropdown, mantendo a primeira
  // grafia encontrada como rótulo.
  const cidadesPara = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const c of companies) {
      const chave = normalizeForCompare(c.endereco.cidade);
      if (chave && !vistos.has(chave)) vistos.set(chave, c.endereco.cidade);
    }
    return Array.from(vistos.values()).sort();
  }, [companies]);

  // Assim que a localização é liberada, já ordena automaticamente por mais próximas.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reage à permissão de geolocalização concedida pelo usuário
    if (status === "granted") setOrdenacao("proximas");
  }, [status]);

  const bairrosDisponiveis = cidade
    ? neighborhoods.filter((b) => b.cidadeId === cities.find((c) => c.nome === cidade)?.id)
    : neighborhoods;

  const results = useMemo(() => {
    let list = [...companies];

    if (termo) {
      const t = termo.toLowerCase();
      list = list.filter(
        (c) =>
          c.nomeFantasia.toLowerCase().includes(t) ||
          c.categoriaNome.toLowerCase().includes(t) ||
          c.descricao.toLowerCase().includes(t)
      );
    }
    if (cidade) {
      const alvo = normalizeForCompare(cidade);
      list = list.filter((c) => normalizeForCompare(c.endereco.cidade) === alvo);
    }
    if (bairro) list = list.filter((c) => c.endereco.bairro === bairro);
    if (categoria) {
      const cat = categories.find((c) => c.slug === categoria);
      if (cat) list = list.filter((c) => c.categoriaId === cat.id);
    }
    if (avaliacao) list = list.filter((c) => c.avaliacaoMedia >= Number(avaliacao));
    if (abertoAgora) list = list.filter((c) => isCompanyOpenNow(c.horarios));
    if (comOfertas)
      list = list.filter((c) => promotions.some((p) => p.companyId === c.id && p.status === "ativa"));
    if (comCupons)
      list = list.filter((c) => coupons.some((cp) => cp.companyId === c.id && cp.status === "ativo"));

    switch (ordenacao) {
      case "avaliadas":
        list.sort((a, b) => b.avaliacaoMedia - a.avaliacaoMedia);
        break;
      case "destaque":
        list.sort((a, b) => Number(b.premium) - Number(a.premium));
        break;
      case "proximas":
        if (coords) {
          list.sort(
            (a, b) =>
              distanceKm(coords, { lat: a.endereco.latitude, lng: a.endereco.longitude }) -
              distanceKm(coords, { lat: b.endereco.latitude, lng: b.endereco.longitude })
          );
        } else {
          list.sort((a, b) => a.endereco.bairro.localeCompare(b.endereco.bairro));
        }
        break;
      default:
        break;
    }

    // patrocinados sempre primeiro
    list.sort((a, b) => Number(b.patrocinada) - Number(a.patrocinada));

    return list;
  }, [
    companies,
    categories,
    promotions,
    coupons,
    termo,
    cidade,
    bairro,
    categoria,
    avaliacao,
    abertoAgora,
    comOfertas,
    comCupons,
    ordenacao,
    coords,
  ]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const paginated = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tituloCategoria = categoria ? categories.find((c) => c.slug === categoria)?.nome : null;
  const titulo = tituloCategoria
    ? `${tituloCategoria}${cidade ? ` em ${cidade}` : ""}`
    : cidade
      ? `Empresas em ${cidade}`
      : "Resultados da busca";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-ink-500">
          <MapPinned size={16} />
          <span className="text-sm">{results.length} resultados</span>
        </div>
        <Button
          variant={status === "granted" ? "outline" : "ghost"}
          size="sm"
          icon={status === "loading" ? <LoaderCircle size={14} className="animate-spin" /> : <LocateFixed size={14} />}
          onClick={requestLocation}
          disabled={status === "loading"}
        >
          {status === "granted"
            ? "Localização ativada"
            : status === "denied"
              ? "Permissão negada — tentar de novo"
              : "Usar minha localização"}
        </Button>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-ink-900 sm:text-3xl">{titulo}</h1>
      {status === "unsupported" && (
        <p className="mt-1 text-xs text-ink-400">Seu navegador não suporta geolocalização.</p>
      )}

      <div className="mt-5">
        <SearchInput
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome, categoria ou serviço..."
        />
      </div>

      <FilterBar
        className="mt-4"
        onClear={() => {
          setCidade("");
          setBairro("");
          setCategoria("");
          setAvaliacao("");
          setAbertoAgora(false);
          setComOfertas(false);
          setComCupons(false);
          setOrdenacao("relevancia");
          setPage(1);
        }}
      >
        <Select
          label="Cidade"
          value={cidade}
          onChange={(e) => {
            setCidade(e.target.value);
            setPage(1);
          }}
          containerClassName="min-w-[160px]"
        >
          <option value="">Todas</option>
          {cidadesPara.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select
          label="Bairro"
          value={bairro}
          onChange={(e) => {
            setBairro(e.target.value);
            setPage(1);
          }}
          containerClassName="min-w-[160px]"
        >
          <option value="">Todos</option>
          {bairrosDisponiveis
            .filter((b, i, arr) => arr.findIndex((x) => x.nome === b.nome) === i)
            .map((b) => (
              <option key={b.id} value={b.nome}>
                {b.nome}
              </option>
            ))}
        </Select>

        <Select
          label="Categoria"
          value={categoria}
          onChange={(e) => {
            setCategoria(e.target.value);
            setPage(1);
          }}
          containerClassName="min-w-[170px]"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.nome}
            </option>
          ))}
        </Select>

        <Select
          label="Avaliação"
          value={avaliacao}
          onChange={(e) => {
            setAvaliacao(e.target.value);
            setPage(1);
          }}
          containerClassName="min-w-[140px]"
        >
          <option value="">Qualquer</option>
          <option value="4.5">4.5+</option>
          <option value="4">4.0+</option>
          <option value="3">3.0+</option>
        </Select>

        <Select
          label="Ordenar por"
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value)}
          containerClassName="min-w-[160px]"
        >
          <option value="relevancia">Relevância</option>
          <option value="proximas">Mais próximas</option>
          <option value="avaliadas">Melhor avaliadas</option>
          <option value="destaque">Destaque</option>
        </Select>

        <div className="flex flex-wrap gap-3 pt-1">
          <Checkbox label="Aberto agora" checked={abertoAgora} onChange={setAbertoAgora} />
          <Checkbox label="Com ofertas" checked={comOfertas} onChange={setComOfertas} icon={<Star size={12} />} />
          <Checkbox label="Com cupons" checked={comCupons} onChange={setComCupons} />
        </div>
      </FilterBar>

      <div className="mt-6">
        {loadingDados ? (
          <LoadingState />
        ) : paginated.length === 0 ? (
          <EmptyState
            title="Nenhuma empresa encontrada"
            description="Tente ajustar os filtros ou buscar por outro termo."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-8" />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-xs font-medium text-ink-600 hover:bg-ink-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-brand-600"
      />
      {icon}
      {label}
    </label>
  );
}
