// Paletas de cor prontas pra Admin → Configurações. Cada uma redefine só a
// escala "brand" (usada em botões, links, destaques em todo o site) — as
// cores neutras (ink) e o laranja de "accent" continuam iguais em qualquer
// paleta, então a legibilidade nunca quebra.
//
// Tecnicamente, essas variáveis já existem em src/app/globals.css
// (--color-brand-50..900): o Tailwind v4 lê elas via @theme inline, então
// sobrescrever esses valores (feito no layout raiz, via style inline no
// <html>) muda a cor em todo o site sem precisar trocar nenhuma classe.
export const PALETAS = {
  verde: {
    50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399",
    500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b",
  },
  azul: {
    50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
    500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a",
  },
  roxo: {
    50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa",
    500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95",
  },
  laranja: {
    50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c",
    500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12",
  },
  rosa: {
    50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185",
    500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337",
  },
} as const;

export type PaletaKey = keyof typeof PALETAS;

export const PALETA_LABELS: Record<PaletaKey, string> = {
  verde: "Verde (padrão)",
  azul: "Azul",
  roxo: "Roxo",
  laranja: "Laranja",
  rosa: "Rosa",
};

export function isPaletaValida(valor: string): valor is PaletaKey {
  return valor in PALETAS;
}

/** CSS custom properties (--color-brand-50..900) pra aplicar via style inline. */
export function paletaCssVars(chave: string): Record<string, string> {
  const paleta = PALETAS[isPaletaValida(chave) ? chave : "verde"];
  const vars: Record<string, string> = {};
  for (const [tom, hex] of Object.entries(paleta)) {
    vars[`--color-brand-${tom}`] = hex;
  }
  return vars;
}
