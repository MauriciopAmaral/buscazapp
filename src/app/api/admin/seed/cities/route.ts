import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/apiResponse";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface IbgeMunicipio {
  id: number;
  nome: string;
}

// POST /api/admin/seed/cities?uf=PA — importa todos os municípios de UM
// estado, direto da API pública do IBGE (fonte oficial). Chamado uma vez
// por estado (o painel faz um loop pelos 27) pra cada requisição terminar
// rápido — importar os ~5.570 municípios do Brasil de uma vez só correria
// risco de estourar o tempo limite de uma função serverless.
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const uf = new URL(request.url).searchParams.get("uf")?.toUpperCase().trim();
    if (!uf || !UFS.includes(uf)) return badRequest("Informe um estado válido (?uf=PA, por exemplo).");

    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`, {
      // Dado público, quase nunca muda — evita rebater na API do IBGE em toda chamada.
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) {
      return serverError(`Não foi possível consultar a API do IBGE pro estado ${uf} (status ${res.status}).`);
    }
    const municipios = (await res.json()) as IbgeMunicipio[];
    if (!Array.isArray(municipios)) {
      return serverError("Resposta inesperada da API do IBGE.");
    }

    const rows = municipios
      .map((m) => (typeof m?.nome === "string" ? m.nome.trim() : ""))
      .filter(Boolean)
      .map((nome) => ({ nome, estado: uf }));

    const resultado = await prisma.city.createMany({ data: rows, skipDuplicates: true });

    return ok({ uf, encontrados: rows.length, criadas: resultado.count });
  } catch (err) {
    console.error("[POST /api/admin/seed/cities]", err);
    return serverError();
  }
}
