// Catálogo de impulsionamentos (Painel → Impulsionar) — os mesmos 5
// formatos e preços por dia que já existiam na versão simulada da tela,
// só que agora esse é o único lugar onde o preço é definido. A API sempre
// recalcula o total a partir daqui (nunca confia no valor que vem do
// navegador), pra ninguém conseguir pagar menos manipulando a requisição.

export const BOOST_TIPOS = [
  "destaque_home",
  "destaque_categoria",
  "destaque_cidade",
  "resultado_patrocinado",
  "promocao_destacada",
] as const;

export type BoostTipo = (typeof BOOST_TIPOS)[number];

export const BOOST_DURACOES = [7, 15, 30] as const;

export const BOOST_CATALOGO: Record<BoostTipo, { nome: string; descricao: string; precoDia: number }> = {
  destaque_home: {
    nome: "Destaque na Home",
    descricao: "Seu perfil aparece na vitrine principal do BuscaZapp.",
    precoDia: 6.9,
  },
  destaque_categoria: {
    nome: "Destaque na categoria",
    descricao: "Fica entre os primeiros resultados da sua categoria.",
    precoDia: 4.9,
  },
  destaque_cidade: {
    nome: "Destaque na cidade",
    descricao: "Aparece em destaque para quem busca na sua cidade.",
    precoDia: 3.9,
  },
  resultado_patrocinado: {
    nome: "Resultado patrocinado",
    descricao: 'Selo "Patrocinado" no topo dos resultados de busca.',
    precoDia: 5.9,
  },
  promocao_destacada: {
    nome: "Promoção destacada",
    descricao: "Sua promoção ativa ganha destaque na aba Ofertas.",
    precoDia: 4.4,
  },
};

export function isBoostTipo(valor: string): valor is BoostTipo {
  return (BOOST_TIPOS as readonly string[]).includes(valor);
}

export function isBoostDuracao(valor: number): valor is (typeof BOOST_DURACOES)[number] {
  return (BOOST_DURACOES as readonly number[]).includes(valor);
}

export function calcularValorBoost(tipo: BoostTipo, dias: number): number {
  return Math.round(BOOST_CATALOGO[tipo].precoDia * dias * 100) / 100;
}
