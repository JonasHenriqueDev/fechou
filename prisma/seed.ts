// Dados de demonstração. Login: demo@orcafacil.test / demo123
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const db = new PrismaClient();
const tok = () => randomBytes(16).toString("base64url");
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000);

async function main() {
  await db.company.deleteMany({ where: { email: "demo@orcafacil.test" } });

  const company = await db.company.create({
    data: {
      name: "Clima Certo Refrigeração",
      slogan: "Buscando o melhor clima para você!",
      document: "12.345.678/0001-90",
      phone: "(19) 3333-4444",
      whatsapp: "(19) 99999-0000",
      email: "demo@orcafacil.test",
      address: "Rua das Palmeiras, 100 — Centro",
      city: "Campinas",
      state: "SP",
      pixKey: "demo@orcafacil.test",
      pixName: "Clima Certo",
      pixCity: "Campinas",
      instagram: "@climacerto",
      website: "climacerto.com.br",
      defaultConditions: "50% na aprovação e 50% na conclusão. Pix, cartão ou dinheiro.",
      defaultWarranty: "90 dias para mão de obra",
      quoteSeq: 2,
      orderSeq: 1,
      receiptSeq: 1,
      users: { create: { name: "Demo", email: "demo@orcafacil.test", passwordHash: await bcrypt.hash("demo123", 10) } },
    },
  });
  const cid = company.id;

  const [ana, bruno] = await Promise.all([
    db.client.create({ data: { companyId: cid, name: "Ana Souza", phone: "(19) 98888-1111", email: "ana@example.com", address: "Av. Brasil, 500" } }),
    db.client.create({ data: { companyId: cid, name: "Bruno Lima", phone: "(19) 97777-2222", document: "123.456.789-00" } }),
  ]);

  const install = await db.catalogItem.create({ data: { companyId: cid, type: "SERVICE", name: "Instalação de ar-condicionado split 9.000 BTUs", unit: "un", price: 450, cost: 80 } });
  const clean = await db.catalogItem.create({ data: { companyId: cid, type: "SERVICE", name: "Limpeza e higienização", unit: "un", price: 180, cost: 25 } });
  const ac = await db.catalogItem.create({ data: { companyId: cid, type: "PRODUCT", name: "Ar-condicionado split 9.000 BTUs inverter", unit: "un", price: 1700, cost: 1350, trackStock: true, stock: 6 } });
  const kit = await db.catalogItem.create({ data: { companyId: cid, type: "PRODUCT", name: "Kit de instalação (tubulação 3m)", unit: "un", price: 177, cost: 90, trackStock: true, stock: 20 } });

  await db.quote.create({
    data: {
      companyId: cid, clientId: ana.id, code: "0001-26", token: tok(), status: "SENT", title: "Climatização da sala",
      validUntil: daysFromNow(20), executionTerm: "2 dias úteis após aprovação", paymentConditions: company.defaultConditions,
      warranty: company.defaultWarranty, discountType: "VALUE", discountValue: 50, deliveryFee: 10, total: 2914,
      items: {
        create: [
          { catalogItemId: install.id, type: "SERVICE", name: install.name, unit: "un", quantity: 2, unitPrice: 450, position: 0 },
          { catalogItemId: ac.id, type: "PRODUCT", name: ac.name, unit: "un", quantity: 1, unitPrice: 1700, position: 1 },
          { catalogItemId: kit.id, type: "PRODUCT", name: kit.name, unit: "un", quantity: 2, unitPrice: 177, position: 2 },
        ],
      },
    },
  });
  await db.quote.create({
    data: {
      companyId: cid, clientId: bruno.id, code: "0002-26", token: tok(), status: "DRAFT", validUntil: daysFromNow(30), total: 360,
      items: { create: [{ catalogItemId: clean.id, type: "SERVICE", name: clean.name, unit: "un", quantity: 2, unitPrice: 180, position: 0 }] },
    },
  });

  const order = await db.order.create({
    data: {
      companyId: cid, clientId: bruno.id, code: "0001-26", token: tok(), kind: "SERVICE_ORDER", status: "IN_PROGRESS",
      title: "Manutenção preventiva", total: 360, scheduledDate: daysFromNow(2),
      items: { create: [{ catalogItemId: clean.id, type: "SERVICE", name: clean.name, unit: "un", quantity: 2, unitPrice: 180, unitCost: 25, position: 0 }] },
      installments: { create: [{ number: 1, amount: 180, dueDate: daysFromNow(-1), paidAmount: 180, paidAt: daysFromNow(-1) }, { number: 2, amount: 180, dueDate: daysFromNow(29) }] },
    },
    include: { installments: true },
  });
  await db.payment.create({
    data: {
      companyId: cid, orderId: order.id, installmentId: order.installments[0].id, clientId: bruno.id, amount: 180, method: "PIX", paidAt: daysFromNow(-1),
      receipt: { create: { companyId: cid, code: "0001-26", token: tok(), description: "Ordem de serviço nº 0001-26 — Manutenção preventiva" } },
      transaction: { create: { companyId: cid, type: "INCOME", category: "Serviços", description: "Ordem de serviço nº 0001-26", amount: 180, date: daysFromNow(-1) } },
    },
  });
  await db.transaction.create({ data: { companyId: cid, type: "EXPENSE", category: "Combustível", description: "Abastecimento", amount: 120, date: daysFromNow(-2) } });

  await db.appointment.create({ data: { companyId: cid, clientId: bruno.id, title: "Executar manutenção", location: "Casa do Bruno", start: daysFromNow(2) } });

  console.log("Seed concluído. Login: demo@orcafacil.test / demo123");
}

main().finally(() => db.$disconnect());
