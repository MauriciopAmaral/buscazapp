import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/apiResponse";

// GET /api/planos — lista pública dos planos pra pré-visualização/compra na
// página "Para empresas" → Planos. Sem autenticação (qualquer visitante do
// site pode ver os preços). Lê a mesma tabela `Plan` que o admin gerencia
// em Admin → Planos — assim os dois nunca ficam dessincronizados.
export async function GET() {
  try {
    const planos = await prisma.plan.findMany({ orderBy: { precoMensal: "asc" } });
    return ok(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      (planos as any[]).map((p) => ({
        id: p.id,
        nome: p.nome,
        precoMensal: Number(p.precoMensal),
        precoTrimestral: Number(p.precoTrimestral),
        precoAnual: Number(p.precoAnual),
        destaque: p.destaque,
        recursos: p.recursos,
      }))
    );
  } catch (err) {
    console.error("[GET /api/planos]", err);
    return serverError();
  }
}
