import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Pra onde levar o usuário depois de logar (ou ao clicar em "Minha conta"
 * no cabeçalho): cada papel tem sua própria área — empresa vai pro painel
 * dela, admin vai pro painel administrativo, e consumidor vai pra tela de
 * conta normal. Usado tanto no login/cadastro (desktop e mobile) quanto no
 * menu do cabeçalho, pra nunca ficar um lugar decidindo diferente do outro.
 */
export function dashboardHrefForRole(role: "consumidor" | "empresa" | "admin" | string) {
  if (role === "empresa") return "/painel";
  if (role === "admin") return "/admin";
  return "/minha-conta";
}

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("pt-BR", opts ?? { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function whatsappLink(numero: string, mensagem?: string) {
  const base = `https://wa.me/${numero.replace(/\D/g, "")}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

export function isCompanyOpenNow(horarios: { dia: string; aberto: boolean; inicio?: string; fim?: string }[]) {
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const now = new Date();
  const diaAtual = dias[now.getDay()];
  const horarioHoje = horarios.find((h) => h.dia === diaAtual);
  if (!horarioHoje || !horarioHoje.aberto || !horarioHoje.inicio || !horarioHoje.fim) return false;
  const [hInicio, mInicio] = horarioHoje.inicio.split(":").map(Number);
  const [hFim, mFim] = horarioHoje.fim.split(":").map(Number);
  const minutosAgora = now.getHours() * 60 + now.getMinutes();
  return minutosAgora >= hInicio * 60 + mInicio && minutosAgora <= hFim * 60 + mFim;
}

// Normaliza nome de cidade (ou qualquer texto) pra comparação — minúsculas,
// sem acento, sem espaços extras. Usado em vez de "===" direto porque o
// nome da cidade vem digitado livremente no cadastro da empresa (não tem
// uma lista fixa de cidades pra escolher), então "Belém", "belem" e "Belém "
// precisam ser tratados como a mesma cidade nos filtros de busca.
export function normalizeForCompare(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
