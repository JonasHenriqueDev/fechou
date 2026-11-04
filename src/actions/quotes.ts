"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { calcTotals } from "@/lib/calc";
import { parseInputDate } from "@/lib/format";
import { docCode, publicToken } from "@/lib/tokens";
import { applyStock, dateOrNow, nextSeq, parseEditor, resolveClient, sanitizeItems } from "./helpers";

export async function saveQuote(id: string | null, fd: FormData) {
  const { companyId } = await requireSession();
  const v = parseEditor(fd);
  const clientId = await resolveClient(companyId, v);
  const items = await sanitizeItems(companyId, v);
  const total = calcTotals(items, v.discountType, v.discountValue, v.deliveryFee).total;
  const data = {
    clientId,
    title: v.title.trim() || null,
    issueDate: dateOrNow(v.issueDate),
    validUntil: parseInputDate(v.validUntil),
    executionTerm: v.executionTerm.trim() || null,
    paymentConditions: v.paymentConditions.trim() || null,
    warranty: v.warranty.trim() || null,
    notes: v.notes.trim() || null,
    discountType: v.discountType,
    discountValue: Number(v.discountValue) || 0,
    deliveryFee: Number(v.deliveryFee) || 0,
    total,
  };
  const photos = v.photos.map((p) => ({ image: p.image, caption: p.caption.trim() || null }));

  let quoteId = id;
  if (id) {
    const existing = await db.quote.findFirst({ where: { id, companyId } });
    if (!existing) redirect("/app/orcamentos");
    await db.$transaction([
      db.quoteItem.deleteMany({ where: { quoteId: id } }),
      db.quotePhoto.deleteMany({ where: { quoteId: id } }),
      db.quote.update({ where: { id }, data: { ...data, items: { create: items }, photos: { create: photos } } }),
    ]);
  } else {
    const seq = await nextSeq(companyId, "quoteSeq");
    const q = await db.quote.create({
      data: { ...data, companyId, code: docCode(seq), token: publicToken(), items: { create: items }, photos: { create: photos } },
    });
    quoteId = q.id;
  }
  revalidatePath("/app/orcamentos");
  redirect(`/app/orcamentos/${quoteId}`);
}

export async function setQuoteStatus(id: string, status: string) {
  const { companyId } = await requireSession();
  const data: Record<string, unknown> = { status };
  if (status === "APPROVED") Object.assign(data, { approvedAt: new Date(), approvedByName: "Administrador", rejectedAt: null });
  if (status === "REJECTED") Object.assign(data, { rejectedAt: new Date() });
  await db.quote.updateMany({ where: { id, companyId }, data });
  revalidatePath(`/app/orcamentos/${id}`);
}

/** Marca como enviado ao compartilhar (não regride status mais avançados). */
export async function markQuoteSent(id: string) {
  const { companyId } = await requireSession();
  await db.quote.updateMany({ where: { id, companyId, status: "DRAFT" }, data: { status: "SENT" } });
  revalidatePath(`/app/orcamentos/${id}`);
}

export async function duplicateQuote(id: string) {
  const { companyId } = await requireSession();
  const q = await db.quote.findFirst({ where: { id, companyId }, include: { items: true, photos: true } });
  if (!q) redirect("/app/orcamentos");
  const seq = await nextSeq(companyId, "quoteSeq");
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });
  const valid = new Date();
  valid.setDate(valid.getDate() + company.defaultValidityDays);
  const copy = await db.quote.create({
    data: {
      companyId, clientId: q.clientId, code: docCode(seq), token: publicToken(), title: q.title,
      validUntil: valid, executionTerm: q.executionTerm, paymentConditions: q.paymentConditions,
      warranty: q.warranty, notes: q.notes, discountType: q.discountType, discountValue: q.discountValue,
      deliveryFee: q.deliveryFee, total: q.total,
      items: { create: q.items.map(({ id: _i, quoteId: _q, ...rest }) => rest) },
      photos: { create: q.photos.map(({ id: _i, quoteId: _q, ...rest }) => rest) },
    },
  });
  redirect(`/app/orcamentos/${copy.id}/editar`);
}

export async function deleteQuote(id: string) {
  const { companyId } = await requireSession();
  await db.quote.deleteMany({ where: { id, companyId } });
  revalidatePath("/app/orcamentos");
  redirect("/app/orcamentos");
}

/** Orçamento aprovado → pedido/OS com os mesmos itens (e baixa de estoque). */
export async function convertQuoteToOrder(id: string, kind: string) {
  const { companyId } = await requireSession();
  const q = await db.quote.findFirst({ where: { id, companyId }, include: { items: { include: { catalogItem: true } } } });
  if (!q) redirect("/app/orcamentos");
  const seq = await nextSeq(companyId, "orderSeq");
  const order = await db.order.create({
    data: {
      companyId, clientId: q.clientId, quoteId: q.id, code: docCode(seq), token: publicToken(),
      kind: kind === "SERVICE_ORDER" ? "SERVICE_ORDER" : "ORDER", title: q.title, notes: q.notes,
      discountType: q.discountType, discountValue: q.discountValue, deliveryFee: q.deliveryFee, total: q.total,
      items: {
        create: q.items.map((i) => ({
          catalogItemId: i.catalogItemId, type: i.type, name: i.name, description: i.description, unit: i.unit,
          quantity: i.quantity, unitPrice: i.unitPrice, unitCost: i.catalogItem?.cost ?? 0, photo: i.photo, position: i.position,
        })),
      },
    },
  });
  await applyStock(order.id, 1);
  await db.quote.update({ where: { id }, data: { status: "CONVERTED" } });
  redirect(`/app/pedidos/${order.id}`);
}
