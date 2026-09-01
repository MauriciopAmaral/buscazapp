// ============================================================
// BuscaZapp — Seed do banco de dados
// Converte os mocks de src/mocks em registros reais no MySQL.
// Rode com: npm run db:seed
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { categories } from "../src/mocks/categories";
import { cities, neighborhoods } from "../src/mocks/locations";
import { companies } from "../src/mocks/companies";
import { products, services } from "../src/mocks/offerings";
import { promotions } from "../src/mocks/promotions";
import { coupons } from "../src/mocks/coupons";
import { reviews } from "../src/mocks/reviews";
import { users } from "../src/mocks/users";
import { planos, subscriptions, payments } from "../src/mocks/subscriptions";
import { companyAnalytics, leads } from "../src/mocks/analytics";
import { claims, prospects, ads } from "../src/mocks/claims";
import { cashbackTransactions } from "../src/mocks/cashback";
import { legacyProvider } from "../src/mocks/legacyCompanies";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed iniciado...");

  // 1. Categorias
  const categoryIdMap = new Map<string, string>();
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        nome: cat.nome,
        icone: cat.icone,
        descricao: cat.descricao,
        ativo: cat.ativo,
      },
    });
    categoryIdMap.set(cat.id, created.id);
  }
  console.log(`✓ ${categoryIdMap.size} categorias`);

  // 2. Cidades e bairros
  const cityIdMap = new Map<string, string>();
  for (const city of cities) {
    const created = await prisma.city.upsert({
      where: { nome_estado: { nome: city.nome, estado: city.estado } },
      update: {},
      create: { nome: city.nome, estado: city.estado },
    });
    cityIdMap.set(city.id, created.id);
  }
  for (const n of neighborhoods) {
    const cidadeId = cityIdMap.get(n.cidadeId);
    if (!cidadeId) continue;
    await prisma.neighborhood.create({ data: { nome: n.nome, cidadeId } });
  }
  console.log(`✓ ${cityIdMap.size} cidades e ${neighborhoods.length} bairros`);

  // 3. Planos
  for (const plano of planos) {
    await prisma.plan.upsert({
      where: { id: plano.id as never },
      update: {},
      create: {
        id: plano.id as never,
        nome: plano.nome,
        precoMensal: plano.precoMensal,
        precoTrimestral: plano.precoTrimestral,
        precoAnual: plano.precoAnual,
        destaque: plano.destaque ?? false,
        recursos: plano.recursos,
      },
    });
  }
  console.log(`✓ ${planos.length} planos`);

  // 4. Empresas (+ horários, galeria, endereço)
  const companyIdMap = new Map<string, string>();
  for (const c of companies) {
    const categoriaId = categoryIdMap.get(c.categoriaId);
    const cidadeId = cityIdMap.get(cities.find((ci) => ci.nome === c.endereco.cidade)?.id ?? "");
    if (!categoriaId) continue;

    const created = await prisma.company.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        nomeFantasia: c.nomeFantasia,
        razaoSocial: c.razaoSocial,
        cnpj: c.cnpj,
        logoUrl: c.logoUrl,
        capaUrl: c.capaUrl,
        categoriaId,
        descricao: c.descricao,
        telefone: c.telefone,
        whatsapp: c.whatsapp,
        email: c.email,
        instagram: c.instagram,
        site: c.site,
        cep: c.endereco.cep,
        logradouro: c.endereco.logradouro,
        numero: c.endereco.numero,
        complemento: c.endereco.complemento,
        bairro: c.endereco.bairro,
        cidadeNome: c.endereco.cidade,
        cidadeId: cidadeId || null,
        estado: c.endereco.estado,
        latitude: c.endereco.latitude,
        longitude: c.endereco.longitude,
        clubeParceiro: c.clubeParceiro ?? false,
        cashbackPercentual: c.cashbackPercentual ?? 0,
        avaliacaoMedia: c.avaliacaoMedia,
        totalAvaliacoes: c.totalAvaliacoes,
        verificado: c.verificado,
        premium: c.premium,
        planoId: c.planoId as never,
        reivindicada: c.reivindicada,
        patrocinada: c.patrocinada ?? false,
        status: c.status as never,
        horarios: {
          create: c.horarios.map((h) => ({
            dia: h.dia,
            aberto: h.aberto,
            inicio: h.inicio,
            fim: h.fim,
          })),
        },
        galeria: {
          create: c.galeria.map((url, i) => ({ url, ordem: i })),
        },
      },
    });
    companyIdMap.set(c.id, created.id);
  }
  console.log(`✓ ${companyIdMap.size} empresas`);

  // 5. Produtos e serviços
  for (const p of products) {
    const companyId = companyIdMap.get(p.companyId);
    if (!companyId) continue;
    await prisma.product.create({
      data: {
        companyId,
        imagemUrl: p.imagemUrl,
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        precoPromocional: p.precoPromocional,
        ativo: p.ativo,
      },
    });
  }
  for (const s of services) {
    const companyId = companyIdMap.get(s.companyId);
    if (!companyId) continue;
    await prisma.service.create({
      data: {
        companyId,
        nome: s.nome,
        descricao: s.descricao,
        precoInicial: s.precoInicial,
        imagemUrl: s.imagemUrl,
      },
    });
  }
  console.log(`✓ ${products.length} produtos e ${services.length} serviços`);

  // 6. Promoções e cupons
  for (const p of promotions) {
    const companyId = companyIdMap.get(p.companyId);
    if (!companyId) continue;
    await prisma.promotion.create({
      data: {
        companyId,
        titulo: p.titulo,
        descricao: p.descricao,
        imagemUrl: p.imagemUrl,
        inicio: new Date(p.inicio),
        termino: new Date(p.termino),
        preco: p.preco,
        precoPromocional: p.precoPromocional,
        status: p.status as never,
      },
    });
  }
  for (const c of coupons) {
    const companyId = companyIdMap.get(c.companyId);
    if (!companyId) continue;
    await prisma.coupon.create({
      data: {
        companyId,
        titulo: c.titulo,
        descricao: c.descricao,
        codigo: c.codigo,
        desconto: c.desconto,
        validade: new Date(c.validade),
        limite: c.limite,
        utilizados: c.utilizados,
        status: c.status as never,
        exclusivoClube: c.exclusivoClube ?? false,
      },
    });
  }
  console.log(`✓ ${promotions.length} promoções e ${coupons.length} cupons`);

  // 7. Avaliações
  for (const r of reviews) {
    const companyId = companyIdMap.get(r.companyId);
    if (!companyId) continue;
    await prisma.review.create({
      data: {
        companyId,
        autor: r.autor,
        avatarUrl: r.avatarUrl,
        nota: r.nota,
        comentario: r.comentario,
        respostaTexto: r.resposta?.texto,
        respostaData: r.resposta ? new Date(r.resposta.data) : undefined,
      },
    });
  }
  console.log(`✓ ${reviews.length} avaliações`);

  // 8. Usuários (senha padrão "123456" — troque depois do primeiro login)
  const senhaHashPadrao = await bcrypt.hash("123456", 10);
  // O usuário importado do banco antigo (demo@buscazap.com.br) mantém a
  // senha real que já tinha lá, em vez de virar "123456" como os demais
  // usuários de demonstração.
  const senhasReais: Record<string, string> = {
    [legacyProvider.email]: legacyProvider.senhaHashOriginal,
  };
  const userIdMap = new Map<string, string>();
  for (const u of users) {
    const companyId = u.companyId ? companyIdMap.get(u.companyId) : undefined;
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        nome: u.nome,
        email: u.email,
        senhaHash: senhasReais[u.email] ?? senhaHashPadrao,
        avatarUrl: u.avatarUrl,
        role: u.role as never,
        companyId: companyId || null,
        clubeAssinante: u.clubeAssinante ?? false,
      },
    });
    userIdMap.set(u.id, created.id);
  }
  console.log(`✓ ${userIdMap.size} usuários (senha padrão: 123456)`);

  // 8.1 Transações de cashback
  for (const t of cashbackTransactions) {
    const userId = userIdMap.get(t.userId);
    const companyId = companyIdMap.get(t.companyId);
    if (!userId || !companyId) continue;
    await prisma.cashbackTransaction.create({
      data: {
        userId,
        companyId,
        valorCompra: t.valorCompra,
        percentual: t.percentual,
        valorCashback: t.valorCashback,
        status: t.status as never,
      },
    });
  }
  console.log(`✓ ${cashbackTransactions.length} transações de cashback`);

  // 9. Assinaturas e pagamentos
  for (const s of subscriptions) {
    const companyId = companyIdMap.get(s.companyId);
    if (!companyId) continue;
    await prisma.subscription.upsert({
      where: { companyId },
      update: {},
      create: {
        companyId,
        planoId: s.planoId as never,
        periodicidade: s.periodicidade as never,
        status: s.status as never,
        proximaCobranca: new Date(s.proximaCobranca),
        valor: s.valor,
      },
    });
  }
  for (const p of payments) {
    const companyId = companyIdMap.get(p.companyId);
    if (!companyId) continue;
    await prisma.payment.create({
      data: {
        companyId,
        data: new Date(p.data),
        valor: p.valor,
        status: p.status as never,
        descricao: p.descricao,
      },
    });
  }
  console.log(`✓ ${subscriptions.length} assinaturas e ${payments.length} pagamentos`);

  // 10. Analytics e leads
  for (const a of companyAnalytics) {
    const companyId = companyIdMap.get(a.companyId);
    if (!companyId) continue;
    await prisma.companyAnalytics.upsert({
      where: { companyId },
      update: {},
      create: {
        companyId,
        visualizacoes: a.visualizacoes,
        cliquesWhatsapp: a.cliquesWhatsapp,
        leads: a.leads,
        cuponsUtilizados: a.cuponsUtilizados,
      },
    });
    for (const point of a.serieDiaria) {
      await prisma.analyticsDaily.upsert({
        where: { companyId_data: { companyId, data: new Date(point.data) } },
        update: {},
        create: {
          companyId,
          data: new Date(point.data),
          visualizacoes: point.visualizacoes,
          cliquesWhatsapp: point.cliquesWhatsapp,
          leads: point.leads,
          cuponsUtilizados: point.cuponsUtilizados,
        },
      });
    }
  }
  for (const l of leads) {
    const companyId = companyIdMap.get(l.companyId);
    if (!companyId) continue;
    await prisma.lead.create({
      data: {
        companyId,
        origem: l.origem as never,
        tipo: l.tipo,
        acao: l.acao,
      },
    });
  }
  console.log(`✓ analytics e ${leads.length} leads`);

  // 11. Reivindicações e prospecção
  for (const c of claims) {
    const companyId = companyIdMap.get(c.companyId);
    if (!companyId) continue;
    await prisma.claim.create({
      data: {
        companyId,
        metodo: c.metodo as never,
        status: c.status as never,
      },
    });
  }
  for (const p of prospects) {
    const companyId = companyIdMap.get(p.companyId);
    if (!companyId) continue;
    await prisma.prospect.upsert({
      where: { companyId },
      update: {},
      create: {
        companyId,
        status: p.status as never,
        ultimoContato: p.ultimoContato ? new Date(p.ultimoContato) : undefined,
      },
    });
  }
  console.log(`✓ ${claims.length} reivindicações e ${prospects.length} prospecções`);

  // 12. Anúncios
  for (const a of ads) {
    const companyId = companyIdMap.get(a.companyId);
    if (!companyId) continue;
    await prisma.ad.create({
      data: {
        tipo: a.tipo as never,
        companyId,
        inicio: new Date(a.inicio),
        termino: new Date(a.termino),
        status: a.status as never,
        cliques: a.cliques,
        impressoes: a.impressoes,
      },
    });
  }
  console.log(`✓ ${ads.length} anúncios`);

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
