import { NextRequest, NextResponse } from "next/server";

// Libera CORS só pras rotas /api/*, pra permitir chamadas de fora do
// domínio do site — por exemplo de um app mobile embutindo uma WebView,
// ou de um painel administrativo em outro domínio. Apps nativos
// (Android/iOS) de verdade não são afetados por CORS (isso é uma regra
// de navegador), mas deixamos liberado aqui pra não travar nenhum
// cenário de integração futura.
//
// Além disso, checa o "modo manutenção" (Admin → Configurações) pras
// páginas públicas: se estiver ligado, mostra a tela de manutenção pra
// qualquer visitante em vez do site normal. /admin, /api, /login e os
// arquivos estáticos continuam acessíveis, pra o admin conseguir entrar
// e desligar o modo manutenção quando quiser.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      return withCors(new NextResponse(null, { status: 204 }));
    }
    return withCors(NextResponse.next());
  }

  try {
    const res = await fetch(new URL("/api/settings", request.url));
    const json = await res.json().catch(() => null);
    if (json?.success && json.data?.modoManutencao) {
      return NextResponse.rewrite(new URL("/manutencao", request.url));
    }
  } catch {
    // Se a checagem falhar (ex: banco fora do ar), deixa o site passar
    // normalmente em vez de derrubar tudo por causa do modo manutenção.
  }

  return NextResponse.next();
}

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!admin|manutencao|login|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
