"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { calcTotals, round2, splitInstallments } from "@/lib/calc";
import { parseInputDate } from "@/lib/format";
import { ORDER_KIND } from "@/lib/constants";
import { docCode, publicToken } from "@/lib/tokens";
import {
  applyStock, createPaymentWithReceipt, nextSeq, numf, parseEditor, refreshInstallment, resolveClient, sanitizeItems, str,
} from "./helpers";

export async function saveOrder(id: string | null, fd: FormData) {
  const { companyId } = await requireSession();
  const v = parseEditor(fd);
  const clientId = await resolveClient(companyId, v);
  const items = await sanitizeItems(companyId, v);
  const costs = new Map(
    (await db.catalogItem.findMany({ where: { companyId, id: { in: items.map((i) => i.catalogItemId).filter(Boolean) as string[] } } })).map((c) => [c.id, c.cost]),
  );
  const total = calcTotals(items, v.discountType, v.discountValue, v.deliveryFee).total;
  const data = {
    clientId,
    kind: v.kind === "SERVICE_ORDER" ? "SERVICE_ORDER" : "ORDER",
    title: v.title.trim() || null,
    scheduledDate: parseInputDate(v.scheduledDate),
    notes: v.notes.trim() || null,
    discountType: v.discountType,
    discountValue: Number(v.discountValue) || 0,
    deliveryFee: Number(v.deliveryFee) || 0,
    total,
    createdAt: parseInputDate(v.issueDate) ?? undefined,
  };
  const itemRows = items.map((i) => ({ ...i, unitCost: i.catalogItemId ? costs.get(i.catalogItemId) ?? 0 : 0 }));

  let orderId = id;
  if (id) {
    const existing = await db.order.findFirst({ where: { id, companyId } });
    if (!existing) redirect("/app/pedidos");
    await applyStock(id, -1);
    await db.$transaction([
      db.orderItem.deleteMany({ where: { orderId: id } }),
      db.order.update({ where: { id }, data: { ...data, items: { create: itemRows } } }),
    ]);
    if (existing.status !== "CANCELED") await applyStock(id, 1);
  } else {
    const seq = await nextSeq(companyId, "orderSeq");
    const o = await db.order.create({ data: { ...data, companyId, code: docCode(seq), token: publicToken(), items: { create: itemRows } } });
    orderId = o.id;
    await applyStock(o.id, 1);
  }
  revalidatePath("/app/pedidos");
  redirect(`/app/pedidos/${orderId}`);
}

export async function setOrderStatus(id: string, status: string) {
  const { companyId } = await requireSession();
  const o = await db.order.findFirst({ where: { id, companyId } });
  if (!o) return;
  await db.order.update({ where: { id }, data: { status } });
  // Cancelar devolve o estoque; reabrir baixa de novo.
  if (status === "CANCELED") await applyStock(id, -1);
  else if (o.status === "CANCELED") await applyStock(id, 1);
  revalidatePath(`/app/pedidos/${id}`);
}

export async function deleteOrder(id: string) {
  const { companyId } = await requireSession();
  const o = await db.order.findFirst({ where: { id, companyId } });
  if (o) {
    await applyStock(id, -1);
    await db.order.delete({ where: { id } });
  }
  revalidatePath("/app/pedidos");
  redirect("/app/pedidos");
}

/** Define/recalcula as parcelas (somente as ainda não pagas são substituídas). */
export async function setPaymentPlan(orderId: string, fd: FormData) {
  const { companyId } = await requireSession();
  const order = await db.order.findFirst({ where: { id: orderId, companyId }, include: { installments: { include: { payments: true } } } });
  if (!order) return;
  const n = Math.max(1, Math.min(48, Math.round(numf(fd, "count")) || 1));
  const interval = Math.max(1, Math.round(numf(fd, "interval")) || 30);
  const first = parseInputDate(str(fd, "firstDue")) ?? new Date();
  const entry = round2(numf(fd, "entry"));

  const locked = order.installments.filter((i) => i.payments.length > 0);
  const lockedTotal = locked.reduce((s, i) => s + i.amount, 0);
  const remaining = round2(order.total - lockedTotal);
  await db.installment.deleteMany({ where: { orderId, id: { notIn: locked.map((i) => i.id) } } });

  let number = locked.length;
  const rows: { orderId: string; number: number; amount: number; dueDate: Date }[] = [];
  let rest = remaining;
  if (entry > 0 && entry < remaining) {
    rows.push({ orderId, number: ++number, amount: entry, dueDate: parseInputDate(new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10))! });
    rest = round2(remaining - entry);
  }
  if (rest > 0) {
    for (const p of splitInstallments(rest, n, first, interval)) rows.push({ orderId, number: ++number, amount: p.amount, dueDate: p.dueDate });
  }
  if (rows.length) await db.installment.createMany({ data: rows });
  revalidatePath(`/app/pedidos/${orderId}`);
}

export async function registerPayment(orderId: string, fd: FormData) {
  const { companyId } = await requireSession();
  const order = await db.order.findFirst({ where: { id: orderId, companyId } });
  if (!order) return;
  const amount = round2(numf(fd, "amount"));
  if (amount <= 0) return;
  const installmentId = str(fd, "installmentId");
  if (installmentId && !(await db.installment.findFirst({ where: { id: installmentId, orderId } }))) return;
  const payment = await createPaymentWithReceipt({
    companyId,
    orderId,
    installmentId,
    clientId: order.clientId,
    amount,
    method: str(fd, "method") ?? "PIX",
    paidAt: parseInputDate(str(fd, "paidAt")) ?? new Date(),
    notes: str(fd, "notes"),
    description: `${ORDER_KIND[order.kind]} nº ${order.code}${order.title ? ` — ${order.title}` : ""}`,
    category: order.kind === "SERVICE_ORDER" ? "Serviços" : "Vendas",
  });
  revalidatePath(`/app/pedidos/${orderId}`);
  if (fd.get("openReceipt")) redirect(`/r/${payment.receipt!.token}`);
}

export async function deletePayment(paymentId: string) {
  const { companyId } = await requireSession();
  const p = await db.payment.findFirst({ where: { id: paymentId, companyId } });
  if (!p) return;
  await db.payment.delete({ where: { id: paymentId } });
  if (p.installmentId) await refreshInstallment(p.installmentId);
  revalidatePath(`/app/pedidos/${p.orderId}`);
  revalidatePath("/app/recibos");
}
