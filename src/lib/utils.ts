import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
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

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
