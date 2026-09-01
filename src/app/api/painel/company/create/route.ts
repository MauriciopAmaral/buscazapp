import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { signAuthToken } from "@/lib/auth";
import { badRequest, conflict, created, forbidden, notFound, serverError, unauthorized } from "@/lib/apiResponse";
import { companyListInclude, mapCompany } from "@/lib/companyData";
import { slugify } from "@/lib/utils";

const REQUIRED_FIELDS = [
  "nomeFantasia",
  "razaoSocial",
  "cnpj",
  "categoriaId",
  "descricao",
  "telefone",
  "whatsapp",
  "cep",
  "logradouro",
  "numero",
  "bairro",
  "cidadeNome",
  "estado",
] as const;

const OPTIONAL_STRING_FIELDS = ["complemento", "email", "instagram", "site"] as const;

// Garante um slug único, tentando "nome-fantasia", depois "nome-fantasia-2", etc.
async function uniqueSlug(base: string): Promise<string> {
  const raw = slugify(base) || "empresa";
  let candidate = raw;
  let i = 2;
  for (;;) {
    const existing = await prisma.company.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = `${raw}-${i}`;
    i += 1;
  }
}

// POST /api/painel/company/create — cadastro de uma empresa nova (não é
// reivindicação de um perfil já existente). Só funciona pra uma conta
// "empresa" que ainda não está vinculada a nenhuma Company. Cria a Company
// já com status "ativo" e "reivindicada: true" (o dono é quem está criando)
// e devolve um TOKEN NOVO já com o companyId embutido — o token antigo do
// usuário não tem esse campo e continuaria sendo recusado pelas outras
// rotas de /api/painel/* até um novo login.
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (auth.companyId) return conflict("Essa conta já está vinculada a uma empresa.");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    const values: Record<string, string> = {};
    for (const field of REQUIRED_FIELDS) {
      const v = typeof body[field] === "string" ? body[field].trim() : "";
      if (!v) return badRequest(`Preencha o campo "${field}".`);
      values[field] = v;
    }
    for (const field of OPTIONAL_STRING_FIELDS) {
      const v = typeof body[field] === "string" ? body[field].trim() : "";
      if (v) values[field] = v;
    }

    const cnpjDigits = values.cnpj.replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      return badRequest("Informe um CNPJ válido (14 dígitos).");
    }

    const categoria = await prisma.category.findUnique({ where: { id: values.categoriaId } });
    if (!categoria) return notFound("Categoria não encontrada.");

    const cnpjExistente = await prisma.company.findUnique({ where: { cnpj: cnpjDigits } });
    if (cnpjExistente) return conflict("Já existe uma empresa cadastrada com esse CNPJ.");

    const slug = await uniqueSlug(values.nomeFantasia);

    const company = await prisma.company.create({
      data: {
        slug,
        nomeFantasia: values.nomeFantasia,
        razaoSocial: values.razaoSocial,
        cnpj: cnpjDigits,
        categoriaId: values.categoriaId,
        descricao: values.descricao,
        telefone: values.telefone,
        whatsapp: values.whatsapp,
        email: values.email,
        instagram: values.instagram,
        site: values.site,
        cep: values.cep,
        logradouro: values.logradouro,
        numero: values.numero,
        complemento: values.complemento,
        bairro: values.bairro,
        cidadeNome: values.cidadeNome,
        estado: values.estado,
        status: "ativo",
        reivindicada: true,
      },
      include: companyListInclude,
    });

    const user = await prisma.user.update({
      where: { id: auth.sub },
      data: { companyId: company.id },
    });

    const token = signAuthToken({ sub: user.id, role: user.role, companyId: user.companyId });

    return created({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        avatarUrl: user.avatarUrl ?? undefined,
        role: user.role,
        companyId: user.companyId,
      },
      company: mapCompany(company),
    });
  } catch (err) {
    console.error("[POST /api/painel/company/create]", err);
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return conflict("Já existe uma empresa com esses dados (slug ou CNPJ duplicado).");
    }
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2025") {
      return forbidden("Usuário não encontrado.");
    }
    return serverError();
  }
}
