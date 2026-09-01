import { Review } from "@/types";
import { companies } from "./companies";

const nomes = [
  "Ana Souza", "Carlos Lima", "Mariana Costa", "João Pereira", "Fernanda Alves",
  "Ricardo Santos", "Juliana Rocha", "Pedro Nogueira", "Camila Ferreira", "Lucas Martins",
  "Patrícia Gomes", "Bruno Cardoso", "Larissa Dias", "Thiago Barbosa", "Vanessa Ribeiro",
  "Rafael Teixeira", "Beatriz Moraes", "Gustavo Correia", "Isabela Castro", "Diego Farias",
];

const comentarios = [
  "Atendimento excelente, super recomendo!",
  "Ótimo custo-benefício, voltarei mais vezes.",
  "Profissionais muito atenciosos e pontuais.",
  "Ambiente agradável e serviço de qualidade.",
  "Superou minhas expectativas, nota 10.",
  "Bom atendimento, mas poderia melhorar o tempo de espera.",
  "Recomendo bastante, preço justo e bom serviço.",
  "Equipe muito simpática e competente.",
  "Voltei outras vezes e sempre fui bem atendido.",
  "Excelente localização e fácil de encontrar.",
];

const reviewedCompanies = companies.filter((c) => c.reivindicada).slice(0, 10);

export const reviews: Review[] = Array.from({ length: 20 }).map((_, i) => {
  const company = reviewedCompanies[i % reviewedCompanies.length];
  const nota = [5, 5, 4, 5, 4, 3, 5, 4, 5, 4][i % 10];
  const d = new Date();
  d.setDate(d.getDate() - (i * 3 + 1));
  const temResposta = i % 3 === 0;
  return {
    id: `review-${i + 1}`,
    companyId: company.id,
    autor: nomes[i % nomes.length],
    avatarUrl: `https://i.pravatar.cc/100?img=${(i % 70) + 1}`,
    nota,
    comentario: comentarios[i % comentarios.length],
    data: d.toISOString(),
    resposta: temResposta
      ? {
          texto: "Muito obrigado pela avaliação! Ficamos felizes em atender você bem.",
          data: new Date(d.getTime() + 86400000).toISOString(),
        }
      : undefined,
  };
});

export function getReviewsByCompany(companyId: string) {
  return reviews.filter((r) => r.companyId === companyId);
}
