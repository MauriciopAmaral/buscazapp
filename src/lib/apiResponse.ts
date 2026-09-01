// ============================================================
// BuscaZapp — envelope de resposta padrão da API
//
// Todo endpoint responde nesse formato, pra qualquer cliente (site,
// app Android, app iOS) tratar sucesso/erro da mesma forma:
//   sucesso: { success: true, data: ... }
//   erro:    { success: false, error: { message, code? } }
// ============================================================

import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

function fail(message: string, status: number, code?: string) {
  return NextResponse.json({ success: false, error: { message, code } }, { status });
}

export function badRequest(message = "Requisição inválida.") {
  return fail(message, 400, "bad_request");
}

export function unauthorized(message = "É preciso estar autenticado.") {
  return fail(message, 401, "unauthorized");
}

export function forbidden(message = "Sem permissão pra fazer isso.") {
  return fail(message, 403, "forbidden");
}

export function notFound(message = "Não encontrado.") {
  return fail(message, 404, "not_found");
}

export function conflict(message = "Já existe.") {
  return fail(message, 409, "conflict");
}

export function serverError(message = "Erro interno do servidor.") {
  return fail(message, 500, "server_error");
}
