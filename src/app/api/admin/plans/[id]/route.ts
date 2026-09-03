import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

const PLANOS_VALIDOS = ["gratuito", "pro", "premium", "premium_plus"] as const;

// PATCH /api/admin/plans/[id] — edita um plano (preços, nome, destaque,
// lista de recursos). Body aceita qualquer subconjunto de:
// { nome, precoMensal, precoTrimestral, precoAnual, destaque, recursos }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    if (!PLANOS_VALIDOS.includes(id as (typeof PLANOS_VALIDOS)[number])) {
      return badRequest("Plano inválido.");
    }

    const existente = await prisma.plan.findUnique({ where: { id: id as (typeof PLANOS_VALIDOS)[number] } });
    if (!existente) return notFound("Plano não encontrado.");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    const data: {
      nome?: string;
      precoMensal?: number;
      precoTrimestral?: number;
      precoAnual?: number;
      destaque?: boolean;
      recursos?: string[];
    } = {};

    if (typeof body.nome === "string" && body.nome.trim()) data.nome = body.nome.trim();

    for (const campo of ["precoMensal", "precoTrimestral", "precoAnual"] as const) {
      if (typeof body[campo] === "number" && Number.isFinite(body[campo]) && body[campo] >= 0) {
        data[campo] = body[campo];
      }
    }

    if (typeof body.destaque === "boolean") data.destaque = body.destaque;

    if (Array.isArray(body.recursos)) {
      const recursos = body.recursos.filter((r: unknown) => typeof r === "string" && r.trim()).map((r: string) => r.trim());
      data.recursos = recursos;
    }

    if (Object.keys(data).length === 0) {
      return badRequest("Nenhum campo válido pra atualizar.");
    }

    const plano = await prisma.plan.update({
      where: { id: id as (typeof PLANOS_VALIDOS)[number] },
      data,
    });

    const assinantes = await prisma.company.count({ where: { planoId: id as (typeof PLANOS_VALIDOS)[number] } });

    return ok({
      id: plano.id,
      nome: plano.nome,
      precoMensal: Number(plano.precoMensal),
      precoTrimestral: Number(plano.precoTrimestral),
      precoAnual: Number(plano.precoAnual),
      destaque: plano.destaque,
      recursos: Array.isArray(plano.recursos) ? plano.recursos : [],
      assinantes,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/plans/[id]]", err);
    return serverError();
  }
}
