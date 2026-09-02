import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// Bairros oficiais — fontes: Belém (CODEM / leis municipais 7.806 e 8.655,
// via IBGE 2022) e Castanhal (Lei Municipal 029/2019) são listas oficiais,
// alta confiança. Ananindeua não tem uma lei consolidada localizável
// publicamente — lista de média confiança (pode ter divergências pontuais
// com a divisão oficial real; dá pra corrigir depois em Admin → Bairros).
// Marabá e Santarém ficaram de fora: não existe uma lista oficial completa
// e confiável disponível publicamente pra essas duas — melhor não inventar.
const BAIRROS: Record<string, string[]> = {
  Belém: [
    "Batista Campos", "Campina", "Cidade Velha", "Comércio", "Marco", "Nazaré", "Reduto", "São Brás", "Umarizal",
    "Benguí", "Cabanagem", "Coqueiro", "Parque Verde", "Pratinha", "São Clemente", "Tapanã", "Una",
    "Águas Lindas", "Aurá", "Castanheira", "Curió-Utinga", "Guanabara", "Mangueirão", "Marambaia", "Souza", "Val-de-Cans", "Universitário",
    "Canudos", "Cremação", "Condor", "Guamá", "Jurunas", "Terra Firme",
    "Águas Negras", "Agulha", "Antônio Lemos", "Campina de Icoaraci", "Cruzeiro", "Maracacuera", "Paracuri", "Parque Guajará", "Ponta Grossa", "Tenoné",
    "Aeroporto", "Ariramba", "Baía do Sol", "Bonfim", "Carananduba", "Caruará", "Chapéu Virado", "Farol", "Mangueiras", "Maracajá", "Marahú", "Murubira", "Natal do Murubira", "Paraíso", "Porto Arthur", "Praia Grande", "São Francisco", "Sucurijuquara", "Vila",
    "Água Boa", "Brasília", "Itaiteua", "São João do Outeiro",
    "Barreiro", "Fátima", "Maracangalha", "Miramar", "Pedreira", "Sacramenta", "Telégrafo",
  ],
  Castanhal: [
    "Betânia", "Bom Jesus", "Caiçara", "Cariri", "Cenóbio", "Centro", "Cristo Redentor", "Estrela", "Fonte Boa",
    "Heliolândia", "Ianetama", "Imperador", "Jaderlândia", "Jardim das Acácias", "Nova Olinda", "Novo Estrela",
    "Oscar Reis", "Pantanal", "Pirapora", "Rouxinol", "Salgadinho", "Salles Jardim", "Santa Catarina", "Santa Helena",
    "Santa Lídia", "São José", "Saudade", "Titanlândia",
  ],
  Ananindeua: [
    "40 Horas", "Águas Brancas", "Águas Lindas", "Atalaia", "Aurá", "Centro", "Cidade Nova", "Coqueiro",
    "Curuçambá", "Distrito Industrial", "Geraldo Palmeira", "Guanabara", "Heliolândia", "Icuí-Guajará",
    "Icuí-Laranjeira", "Jaderlândia", "Jiboia Branca", "Júlia Sefer", "Maguari", "PAAR", "Providência",
  ],
};

const ESTADO_POR_CIDADE: Record<string, string> = {
  Belém: "PA",
  Castanhal: "PA",
  Ananindeua: "PA",
};

// POST /api/admin/seed/neighborhoods — importa os bairros de Belém,
// Castanhal e Ananindeua. Cria a City se ainda não existir (útil se
// "Importar cidades" ainda não rodou pro Pará).
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const porCidade: Record<string, { criados: number; total: number }> = {};

    for (const [cidadeNome, bairros] of Object.entries(BAIRROS)) {
      const estado = ESTADO_POR_CIDADE[cidadeNome];
      const cidade = await prisma.city.upsert({
        where: { nome_estado: { nome: cidadeNome, estado } },
        update: {},
        create: { nome: cidadeNome, estado },
      });

      const resultado = await prisma.neighborhood.createMany({
        data: bairros.map((nome) => ({ nome, cidadeId: cidade.id })),
        skipDuplicates: true,
      });

      porCidade[cidadeNome] = { criados: resultado.count, total: bairros.length };
    }

    return ok(porCidade);
  } catch (err) {
    console.error("[POST /api/admin/seed/neighborhoods]", err);
    return serverError();
  }
}
