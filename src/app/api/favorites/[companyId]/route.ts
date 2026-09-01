import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// DELETE /api/favorites/[companyId] — remove dos favoritos do usuário logado.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized();

    const { companyId } = await params;
    await prisma.favorite.deleteMany({ where: { userId: auth.sub, companyId } });

    return ok({ removed: true });
  } catch (err) {
    console.error("[DELETE /api/favorites/[companyId]]", err);
    return serverError();
  }
}
