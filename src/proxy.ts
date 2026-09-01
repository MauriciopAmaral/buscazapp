import { NextRequest, NextResponse } from "next/server";

// Libera CORS só pras rotas /api/*, pra permitir chamadas de fora do
// domínio do site — por exemplo de um app mobile embutindo uma WebView,
// ou de um painel administrativo em outro domínio. Apps nativos
// (Android/iOS) de verdade não são afetados por CORS (isso é uma regra
// de navegador), mas deixamos liberado aqui pra não travar nenhum
// cenário de integração futura.
export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }));
  }
  return withCors(NextResponse.next());
}

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
