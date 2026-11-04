import "server-only";
import { db } from "@/lib/db";
import { parseInputDate } from "@/lib/format";
import { persistImages } from "@/lib/storage";
import type { EditorValue } from "@/components/DocumentEditor";

export const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
};
export const numf = (fd: FormData, k: string) => Number(String(fd.get(k) ?? "0").replace(",", ".")) || 0;

export function parseEditor(fd: FormData): EditorValue {
  return JSON.parse(String(fd.get("payload")));
}

/** Usa o cliente selecionado (validando o tenant) ou cria um novo a partir do nome digitado. */
export async function resolveClient(companyId: string, v: EditorValue) {
  if (v.clientId) {
    const c = await db.client.findFirst({ where: { id: v.clientId, companyId } });
    return c?.id ?? null;
  }
  if (v.newClientName.trim()) {
    const c = await db.client.create({ data: { companyId, name: v.newClientName.trim(), phone: v.newClientPhone.trim() || null } });
    return c.id;
  }
  return null;
}

/** Só mantém vínculos com itens do catálogo da própria empresa. */
export async function sanitizeItems(companyId: string, v: EditorValue) {
  const ids = v.items.map((i) => i.catalogItemId).filter(Boolean) as string[];
  const valid = new Set((await db.catalogItem.findMany({ where: { companyId, id: { in: ids } }, select: { id: true } })).map((c) => c.id));
  const kept = v.items.filter((i) => i.name.trim());
  const photos = await persistImages(kept, (i) => i.photo, "itens", companyId);
  return kept
    .map((i, position) => ({
      catalogItemId: i.catalogItemId && valid.has(i.catalogItemId) ? i.catalogItemId : null,
      type: i.type === "SERVICE" ? "SERVICE" : "PRODUCT",
      name: i.name.trim(),
      description: i.description?.trim() || null,
      unit: i.unit || "un",
      quantity: Number(i.quantity) || 0,
      unitPrice: Number(i.unitPrice) || 0,
      photo: photos[position],
      position,
    }));
}

export const dateOrNow = (s: string) => parseInputDate(s) ?? new Date();

/**
 * Movimenta o estoque dos produtos controlados de um pedido.
 * sign = 1 baixa (pedido criado), sign = -1 devolve (pedido cancelado/excluído/editado).
 * Fica fora de arquivos "use server" para não virar endpoint público.
 */
export async function applyStock(orderId: string, sign: 1 | -1) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: { include: { catalogItem: true } } } });
  if (!order) return;
  if (sign === 1 && order.stockApplied) return;
  if (sign === -1 && !order.stockApplied) return;
  for (const i of order.items) {
    if (i.catalogItem?.trackStock && i.type === "PRODUCT") {
      await db.catalogItem.update({ where: { id: i.catalogItem.id }, data: { stock: { increment: -sign * i.quantity } } });
    }
  }
  await db.order.update({ where: { id: orderId }, data: { stockApplied: sign === 1 } });
}

/**
 * Registra um recebimento e fecha o ciclo: pagamento → lançamento de receita no
 * financeiro → recibo numerado com link público.
 */
export async function createPaymentWithReceipt(input: {
  companyId: string;
  orderId?: string | null;
  installmentId?: string | null;
  clientId?: string | null;
  amount: number;
  method: string;
  paidAt: Date;
  notes?: string | null;
  description: string;
  category: string;
}) {
  const seq = await nextSeq(input.companyId, "receiptSeq");
  const { randomBytes } = await import("crypto");
  const payment = await db.payment.create({
    data: {
      companyId: input.companyId,
      orderId: input.orderId ?? null,
      installmentId: input.installmentId ?? null,
      clientId: input.clientId ?? null,
      amount: input.amount,
      method: input.method,
      paidAt: input.paidAt,
      notes: input.notes ?? null,
      receipt: {
        create: {
          companyId: input.companyId,
          code: `${String(seq).padStart(4, "0")}-${String(input.paidAt.getFullYear()).slice(2)}`,
          token: randomBytes(16).toString("base64url"),
          description: input.description,
        },
      },
      transaction: {
        create: {
          companyId: input.companyId,
          type: "INCOME",
          category: input.category,
          description: input.description,
          amount: input.amount,
          date: input.paidAt,
        },
      },
    },
    include: { receipt: true },
  });
  if (input.installmentId) await refreshInstallment(input.installmentId);
  return payment;
}

export async function refreshInstallment(installmentId: string) {
  const inst = await db.installment.findUnique({ where: { id: installmentId }, include: { payments: true } });
  if (!inst) return;
  const paid = inst.payments.reduce((s, p) => s + p.amount, 0);
  const last = inst.payments.map((p) => p.paidAt).sort((a, b) => +b - +a)[0];
  await db.installment.update({
    where: { id: installmentId },
    data: { paidAmount: Math.round(paid * 100) / 100, paidAt: paid >= inst.amount - 0.005 ? last : null },
  });
}

/** Incrementa e devolve o próximo número sequencial do documento (por empresa). */
export async function nextSeq(companyId: string, field: "quoteSeq" | "orderSeq" | "receiptSeq") {
  const c = await db.company.update({ where: { id: companyId }, data: { [field]: { increment: 1 } } });
  return c[field];
}
