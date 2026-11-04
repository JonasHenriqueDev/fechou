// Dados de demonstração (instalador de ar-condicionado). Login: demo@fechou.test / demo123
// Só apaga e recria a empresa demo (filtro por e-mail) — seguro rodar em qualquer banco.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";

const db = new PrismaClient();
const tok = () => randomBytes(16).toString("base64url");
const daysFromNow = (d: number, hour = 12) => {
  const x = new Date(Date.now() + d * 86400000);
  x.setUTCHours(hour, 0, 0, 0);
  return x;
};
const yy = String(new Date().getUTCFullYear()).slice(-2);
const code = (n: number) => `${String(n).padStart(4, "0")}-${yy}`;

type Line = { item: { id: string; type: string; name: string; unit: string; price: number; cost: number }; qty: number; price?: number };
const lines = (list: Line[], withCost = false) =>
  list.map((l, position) => ({
    catalogItemId: l.item.id, type: l.item.type, name: l.item.name, unit: l.item.unit,
    quantity: l.qty, unitPrice: l.price ?? l.item.price, position,
    ...(withCost ? { unitCost: l.item.cost } : {}),
  }));
const sum = (list: Line[]) => list.reduce((s, l) => s + l.qty * (l.price ?? l.item.price), 0);

async function main() {
  await db.company.deleteMany({ where: { email: "demo@fechou.test" } });
  const demoUserId = randomUUID();

  const company = await db.company.create({
    data: {
      name: "Clima Certo Refrigeração",
      slogan: "Buscando o melhor clima para você!",
      document: "12.345.678/0001-90",
      phone: "(19) 3333-4444",
      whatsapp: "(19) 99999-0000",
      email: "demo@fechou.test",
      address: "Rua das Palmeiras, 100 — Centro",
      city: "Campinas",
      state: "SP",
      pixKey: "demo@fechou.test",
      pixName: "Clima Certo",
      pixCity: "Campinas",
      instagram: "@climacerto",
      website: "climacerto.com.br",
      defaultConditions: "50% de entrada no Pix na aprovação e 50% na conclusão. Aceitamos Pix, cartão ou dinheiro.",
      defaultWarranty: "90 dias na mão de obra e garantia do fabricante no aparelho",
      quoteSeq: 6,
      orderSeq: 3,
      receiptSeq: 3,
      // Mesmo formato que o Better Auth grava: senha (bcrypt) numa Account "credential" com accountId = id do usuário.
      users: {
        create: {
          id: demoUserId,
          name: "Carlos (Clima Certo)",
          email: "demo@fechou.test",
          emailVerified: true,
          accounts: { create: { accountId: demoUserId, providerId: "credential", password: await bcrypt.hash("demo123", 10) } },
        },
      },
    },
  });
  const cid = company.id;

  // ---------- Catálogo ----------
  const item = (type: "SERVICE" | "PRODUCT", name: string, price: number, cost: number, extra: { unit?: string; stock?: number; description?: string } = {}) =>
    db.catalogItem.create({
      data: {
        companyId: cid, type, name, price, cost, unit: extra.unit ?? "un", description: extra.description,
        ...(extra.stock !== undefined ? { trackStock: true, stock: extra.stock } : {}),
      },
    });

  const inst9 = await item("SERVICE", "Instalação split 9.000 BTUs", 450, 60);
  const inst12 = await item("SERVICE", "Instalação split 12.000 BTUs", 500, 70);
  const inst18 = await item("SERVICE", "Instalação split 18.000 BTUs", 600, 80);
  const inst24 = await item("SERVICE", "Instalação split 24.000 BTUs", 750, 100);
  const uninstall = await item("SERVICE", "Desinstalação de split (com recolhimento de gás)", 200, 20);
  const clean = await item("SERVICE", "Limpeza e higienização completa", 180, 25, { description: "Evaporadora e condensadora, bactericida e teste de funcionamento" });
  const preventive = await item("SERVICE", "Manutenção preventiva (PMOC)", 220, 30);
  const gas = await item("SERVICE", "Carga de gás R-410A", 350, 120);
  const visit = await item("SERVICE", "Visita técnica / diagnóstico", 100, 15, { description: "Abatido do valor do serviço se aprovado" });

  const ac9 = await item("PRODUCT", "Ar-condicionado split 9.000 BTUs inverter", 1700, 1350, { stock: 6 });
  const ac12 = await item("PRODUCT", "Ar-condicionado split 12.000 BTUs inverter", 2100, 1700, { stock: 4 });
  const kit = await item("PRODUCT", "Kit de instalação (tubulação 3 m, cabo PP, isolamento)", 177, 90, { stock: 20 });
  const pipe = await item("PRODUCT", "Tubulação de cobre adicional", 60, 32, { unit: "m", stock: 50 });
  const bracket = await item("PRODUCT", "Suporte para condensadora", 85, 40, { stock: 15 });
  const drain = await item("PRODUCT", "Mangueira de dreno", 8, 3, { unit: "m", stock: 40 });
  const capacitor = await item("PRODUCT", "Capacitor 35 µF", 45, 18, { stock: 2 });

  // ---------- Clientes ----------
  const client = (data: { name: string; phone?: string; email?: string; document?: string; address?: string; notes?: string }) =>
    db.client.create({ data: { companyId: cid, ...data } });
  const ana = await client({ name: "Ana Souza", phone: "(19) 98888-1111", email: "ana@example.com", address: "Av. Brasil, 500 — Jardim Chapadão" });
  const bruno = await client({ name: "Bruno Lima", phone: "(19) 97777-2222", document: "123.456.789-00", address: "Rua Barão de Jaguara, 1200" });
  const condo = await client({ name: "Condomínio Residencial Primavera", phone: "(19) 3255-0000", document: "98.765.432/0001-10", address: "Rua das Flores, 300 — Cambuí", notes: "Falar com o síndico Roberto. Manutenção a cada 6 meses." });
  const carla = await client({ name: "Carla Mendes", phone: "(19) 96666-3333", email: "carla@example.com" });
  const diego = await client({ name: "Diego Rocha — Restaurante Sabor Caseiro", phone: "(19) 95555-4444", document: "45.678.912/0001-33", address: "Av. Norte-Sul, 850" });
  const julia = await client({ name: "Júlia Ferreira", phone: "(19) 94444-5555", address: "Rua Coronel Quirino, 77 — apto 52" });

  // ---------- Orçamentos ----------
  const common = { executionTerm: "Até 3 dias úteis após a aprovação", paymentConditions: company.defaultConditions, warranty: company.defaultWarranty };

  const q1 = [{ item: inst9, qty: 2 }, { item: ac9, qty: 1 }, { item: kit, qty: 2 }, { item: pipe, qty: 3 }];
  await db.quote.create({
    data: {
      companyId: cid, clientId: ana.id, code: code(1), token: tok(), status: "VIEWED", title: "Climatização da sala e do quarto",
      issueDate: daysFromNow(-2), validUntil: daysFromNow(13), ...common, discountType: "VALUE", discountValue: 50, deliveryFee: 30,
      total: sum(q1) + 30 - 50, viewCount: 3, viewedAt: daysFromNow(-1, 22),
      items: { create: lines(q1) },
    },
  });

  const q2 = [{ item: clean, qty: 2 }];
  const quoteBruno = await db.quote.create({
    data: {
      companyId: cid, clientId: bruno.id, code: code(2), token: tok(), status: "CONVERTED", title: "Limpeza de 2 aparelhos",
      issueDate: daysFromNow(-6), validUntil: daysFromNow(9), ...common, total: sum(q2),
      approvedAt: daysFromNow(-5), approvedByName: "Bruno Lima",
      items: { create: lines(q2) },
    },
  });

  const q3 = [{ item: preventive, qty: 8, price: 190 }, { item: capacitor, qty: 1 }];
  const quoteCondo = await db.quote.create({
    data: {
      companyId: cid, clientId: condo.id, code: code(3), token: tok(), status: "CONVERTED", title: "Manutenção preventiva — áreas comuns (8 aparelhos)",
      issueDate: daysFromNow(-10), validUntil: daysFromNow(5), ...common, notes: "Valor especial por volume. Inclui relatório PMOC.",
      total: sum(q3), approvedAt: daysFromNow(-8), approvedByName: "Roberto Alves (síndico)",
      items: { create: lines(q3) },
    },
  });

  const q4 = [{ item: inst18, qty: 1 }, { item: kit, qty: 1 }, { item: pipe, qty: 5 }, { item: bracket, qty: 1 }];
  await db.quote.create({
    data: {
      companyId: cid, clientId: carla.id, code: code(4), token: tok(), status: "REJECTED", title: "Instalação 18.000 BTUs — escritório",
      issueDate: daysFromNow(-12), validUntil: daysFromNow(3), ...common, total: sum(q4),
      viewCount: 2, viewedAt: daysFromNow(-11), rejectedAt: daysFromNow(-9), rejectReason: "Fechei com outro técnico, mais barato.",
      items: { create: lines(q4) },
    },
  });

  const q5 = [{ item: inst24, qty: 2 }, { item: kit, qty: 2 }, { item: pipe, qty: 8 }, { item: bracket, qty: 2 }, { item: drain, qty: 10 }];
  await db.quote.create({
    data: {
      companyId: cid, clientId: diego.id, code: code(5), token: tok(), status: "SENT", title: "Instalação de 2 splits 24.000 BTUs no salão",
      issueDate: daysFromNow(0), validUntil: daysFromNow(15), ...common, discountType: "PERCENT", discountValue: 5,
      total: Math.round(sum(q5) * 0.95 * 100) / 100,
      items: { create: lines(q5) },
    },
  });

  const q6 = [{ item: uninstall, qty: 1 }, { item: ac12, qty: 1 }, { item: inst12, qty: 1 }, { item: kit, qty: 1 }];
  await db.quote.create({
    data: {
      companyId: cid, clientId: julia.id, code: code(6), token: tok(), status: "DRAFT", title: "Troca do aparelho antigo por split 12.000 BTUs",
      validUntil: daysFromNow(10), ...common, total: sum(q6),
      items: { create: lines(q6) },
    },
  });

  // ---------- Pedidos / OS ----------
  // OS 1 — Bruno: em andamento, entrada paga.
  const o1 = await db.order.create({
    data: {
      companyId: cid, clientId: bruno.id, quoteId: quoteBruno.id, code: code(1), token: tok(), kind: "SERVICE_ORDER", status: "IN_PROGRESS",
      title: "Limpeza de 2 aparelhos", total: sum(q2), scheduledDate: daysFromNow(2),
      items: { create: lines(q2, true) },
      installments: { create: [{ number: 1, amount: 180, dueDate: daysFromNow(-5), paidAmount: 180, paidAt: daysFromNow(-5) }, { number: 2, amount: 180, dueDate: daysFromNow(2) }] },
    },
    include: { installments: true },
  });

  // OS 2 — Condomínio: do orçamento 3, 3 parcelas, 1ª paga.
  const condoTotal = sum(q3);
  const o2 = await db.order.create({
    data: {
      companyId: cid, clientId: condo.id, quoteId: quoteCondo.id, code: code(2), token: tok(), kind: "SERVICE_ORDER", status: "OPEN",
      title: quoteCondo.title, total: condoTotal, scheduledDate: daysFromNow(5), stockApplied: true,
      notes: "Acesso pela portaria de serviço, das 8h às 17h.",
      items: { create: lines(q3, true) },
      installments: {
        create: [
          { number: 1, amount: 535, dueDate: daysFromNow(-7), paidAmount: 535, paidAt: daysFromNow(-7) },
          { number: 2, amount: 530, dueDate: daysFromNow(23) },
          { number: 3, amount: 500, dueDate: daysFromNow(53) },
        ],
      },
    },
    include: { installments: true },
  });
  await db.catalogItem.update({ where: { id: capacitor.id }, data: { stock: { decrement: 1 } } });

  // Pedido 3 — Diego: carga de gás concluída e paga à vista.
  const o3Lines = [{ item: gas, qty: 1 }, { item: visit, qty: 1, price: 0 }];
  const o3 = await db.order.create({
    data: {
      companyId: cid, clientId: diego.id, code: code(3), token: tok(), kind: "SERVICE_ORDER", status: "DONE",
      title: "Carga de gás — câmara do salão", total: sum(o3Lines), scheduledDate: daysFromNow(-15),
      items: { create: lines(o3Lines, true) },
      installments: { create: [{ number: 1, amount: 350, dueDate: daysFromNow(-15), paidAmount: 350, paidAt: daysFromNow(-15) }] },
    },
    include: { installments: true },
  });

  // ---------- Recebimentos (Payment + Recibo + lançamento automático) ----------
  const pay = (o: { id: string; code: string; title: string | null; clientId: string | null; installments: { id: string }[] }, n: number, amount: number, days: number, method: string) =>
    db.payment.create({
      data: {
        companyId: cid, orderId: o.id, installmentId: o.installments[0].id, clientId: o.clientId, amount, method, paidAt: daysFromNow(days),
        receipt: { create: { companyId: cid, code: code(n), token: tok(), description: `Ordem de serviço nº ${o.code} — ${o.title}` } },
        transaction: { create: { companyId: cid, type: "INCOME", category: "Serviços", description: `Ordem de serviço nº ${o.code}`, amount, date: daysFromNow(days) } },
      },
    });
  await pay(o3, 1, 350, -15, "PIX");
  await pay(o2, 2, 535, -7, "PIX");
  await pay(o1, 3, 180, -5, "PIX");

  // ---------- Financeiro (lançamentos manuais) ----------
  const expense = (category: string, description: string, amount: number, days: number) =>
    db.transaction.create({ data: { companyId: cid, type: "EXPENSE", category, description, amount, date: daysFromNow(days) } });
  await expense("Combustível", "Abastecimento da Fiorino", 180, -2);
  await expense("Materiais", "Cilindro de gás R-410A", 420, -16);
  await expense("Materiais", "Rolo de tubulação de cobre 15 m", 380, -9);
  await expense("Ferramentas", "Bomba de vácuo (parcela 2/3)", 210, -4);
  await expense("Impostos", "DAS MEI", 81.05, -12);
  await db.transaction.create({ data: { companyId: cid, type: "INCOME", category: "Vendas", description: "Venda de controle remoto universal", amount: 60, date: daysFromNow(-3) } });

  // ---------- Agenda ----------
  const appt = (title: string, days: number, hour: number, clientId: string | null, location?: string, description?: string) =>
    db.appointment.create({ data: { companyId: cid, clientId, title, start: daysFromNow(days, hour), location, description } });
  await appt("Visita técnica — medir para troca do aparelho", 1, 12, julia.id, "Rua Coronel Quirino, 77 — apto 52");
  await appt("Limpeza de 2 aparelhos", 2, 13, bruno.id, "Rua Barão de Jaguara, 1200");
  await appt("Manutenção preventiva — condomínio", 5, 11, condo.id, "Rua das Flores, 300", "Levar escada de 6 m e capacitor reserva");
  await appt("Ligar para a Ana sobre o orçamento", 0, 20, ana.id);

  console.log("Seed concluído. Login: demo@fechou.test / demo123");
}

main().finally(() => db.$disconnect());
