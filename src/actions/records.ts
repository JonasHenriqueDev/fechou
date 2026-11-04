"use server";

// Cadastros simples: clientes, catálogo, financeiro, agenda, recibos avulsos, empresa e notificações.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { parseInputDate, parseInputDateTime } from "@/lib/format";
import { round2 } from "@/lib/calc";
import { persistImage } from "@/lib/storage";
import { createPaymentWithReceipt, numf, str } from "./helpers";

/* ---------------- Clientes ---------------- */

export async function saveClient(id: string | null, fd: FormData) {
  const { companyId } = await requireSession();
  const name = str(fd, "name");
  if (!name) return;
  const data = {
    name,
    document: str(fd, "document"),
    phone: str(fd, "phone"),
    phone2: str(fd, "phone2"),
    email: str(fd, "email"),
    address: str(fd, "address"),
    notes: str(fd, "notes"),
  };
  let clientId = id;
  if (id) await db.client.updateMany({ where: { id, companyId }, data });
  else clientId = (await db.client.create({ data: { ...data, companyId } })).id;
  revalidatePath("/app/clientes");
  redirect(String(fd.get("returnTo") || `/app/clientes/${clientId}`));
}

/** Importação em lote (CSV/vCard da agenda já convertidos em linhas no navegador). */
export async function importClients(fd: FormData) {
  const { companyId } = await requireSession();
  const rows = JSON.parse(String(fd.get("rows") ?? "[]")) as { name: string; phone?: string; email?: string }[];
  const valid = rows.filter((r) => r.name?.trim()).slice(0, 2000);
  if (valid.length)
    await db.client.createMany({
      data: valid.map((r) => ({ companyId, name: r.name.trim(), phone: r.phone?.trim() || null, email: r.email?.trim() || null })),
    });
  revalidatePath("/app/clientes");
  redirect(`/app/clientes?importados=${valid.length}`);
}

export async function deleteClient(id: string) {
  const { companyId } = await requireSession();
  await db.client.deleteMany({ where: { id, companyId } });
  revalidatePath("/app/clientes");
  redirect("/app/clientes");
}

/* ---------------- Catálogo / estoque ---------------- */

export async function saveCatalogItem(id: string | null, fd: FormData) {
  const { companyId } = await requireSession();
  const name = str(fd, "name");
  if (!name) return;
  const data = {
    type: fd.get("type") === "SERVICE" ? "SERVICE" : "PRODUCT",
    name,
    description: str(fd, "description"),
    unit: str(fd, "unit") ?? "un",
    price: round2(numf(fd, "price")),
    cost: round2(numf(fd, "cost")),
    trackStock: fd.get("trackStock") === "on",
    stock: fd.has("stock") ? numf(fd, "stock") : undefined,
    photo: await persistImage(str(fd, "photo"), "catalogo", companyId),
    active: fd.get("active") !== "off",
  };
  if (id) await db.catalogItem.updateMany({ where: { id, companyId }, data });
  else await db.catalogItem.create({ data: { ...data, companyId } });
  revalidatePath("/app/catalogo");
  redirect(`/app/catalogo?tipo=${data.type}`);
}

export async function adjustStock(id: string, fd: FormData) {
  const { companyId } = await requireSession();
  const delta = numf(fd, "delta");
  if (delta) await db.catalogItem.updateMany({ where: { id, companyId }, data: { stock: { increment: delta } } });
  revalidatePath("/app/catalogo");
}

export async function deleteCatalogItem(id: string) {
  const { companyId } = await requireSession();
  await db.catalogItem.deleteMany({ where: { id, companyId } });
  revalidatePath("/app/catalogo");
  redirect("/app/catalogo");
}

/* ---------------- Financeiro ---------------- */

export async function saveTransaction(id: string | null, fd: FormData) {
  const { companyId } = await requireSession();
  const amount = round2(numf(fd, "amount"));
  const description = str(fd, "description");
  if (!description || amount <= 0) return;
  const data = {
    type: fd.get("type") === "EXPENSE" ? "EXPENSE" : "INCOME",
    category: str(fd, "category") ?? "Outros",
    description,
    amount,
    date: parseInputDate(str(fd, "date")) ?? new Date(),
  };
  // Lançamentos gerados por recebimento (paymentId) só são editados via pedido/recibo.
  if (id) await db.transaction.updateMany({ where: { id, companyId, paymentId: null }, data });
  else await db.transaction.create({ data: { ...data, companyId } });
  revalidatePath("/app/financeiro");
  redirect("/app/financeiro");
}

export async function deleteTransaction(id: string) {
  const { companyId } = await requireSession();
  await db.transaction.deleteMany({ where: { id, companyId, paymentId: null } });
  revalidatePath("/app/financeiro");
}

/* ---------------- Recibo avulso ---------------- */

export async function createStandaloneReceipt(fd: FormData) {
  const { companyId } = await requireSession();
  const amount = round2(numf(fd, "amount"));
  const description = str(fd, "description");
  if (!description || amount <= 0) return;
  let clientId = str(fd, "clientId");
  if (clientId && !(await db.client.findFirst({ where: { id: clientId, companyId } }))) clientId = null;
  const p = await createPaymentWithReceipt({
    companyId,
    clientId,
    amount,
    method: str(fd, "method") ?? "PIX",
    paidAt: parseInputDate(str(fd, "paidAt")) ?? new Date(),
    description,
    category: str(fd, "category") ?? "Serviços",
  });
  redirect(`/r/${p.receipt!.token}`);
}

/* ---------------- Agenda ---------------- */

export async function saveAppointment(id: string | null, fd: FormData) {
  const { companyId } = await requireSession();
  const title = str(fd, "title");
  const start = parseInputDateTime(str(fd, "start"));
  if (!title || !start) return;
  let clientId = str(fd, "clientId");
  if (clientId && !(await db.client.findFirst({ where: { id: clientId, companyId } }))) clientId = null;
  const data = {
    title,
    clientId,
    description: str(fd, "description"),
    location: str(fd, "location"),
    start,
    end: parseInputDateTime(str(fd, "end")),
    remindMin: Math.round(numf(fd, "remindMin")),
  };
  if (id) await db.appointment.updateMany({ where: { id, companyId }, data });
  else await db.appointment.create({ data: { ...data, companyId } });
  revalidatePath("/app/agenda");
  redirect(`/app/agenda?dia=${str(fd, "start")!.slice(0, 10)}`);
}

export async function toggleAppointment(id: string) {
  const { companyId } = await requireSession();
  const a = await db.appointment.findFirst({ where: { id, companyId } });
  if (a) await db.appointment.update({ where: { id }, data: { done: !a.done } });
  revalidatePath("/app/agenda");
}

export async function deleteAppointment(id: string) {
  const { companyId } = await requireSession();
  await db.appointment.deleteMany({ where: { id, companyId } });
  revalidatePath("/app/agenda");
  redirect("/app/agenda");
}

/* ---------------- Empresa ---------------- */

export async function saveCompany(fd: FormData) {
  const { companyId } = await requireSession();
  const name = str(fd, "name");
  if (!name) return;
  await db.company.update({
    where: { id: companyId },
    data: {
      name,
      slogan: str(fd, "slogan"),
      document: str(fd, "document"),
      phone: str(fd, "phone"),
      whatsapp: str(fd, "whatsapp"),
      email: str(fd, "email"),
      address: str(fd, "address"),
      city: str(fd, "city"),
      state: str(fd, "state"),
      logo: await persistImage(str(fd, "logo"), "logos", companyId),
      signature: await persistImage(str(fd, "signature"), "assinaturas", companyId),
      primaryColor: str(fd, "primaryColor") ?? "#1d5cf1",
      pixKey: str(fd, "pixKey"),
      pixName: str(fd, "pixName"),
      pixCity: str(fd, "pixCity"),
      instagram: str(fd, "instagram"),
      facebook: str(fd, "facebook"),
      youtube: str(fd, "youtube"),
      website: str(fd, "website"),
      defaultValidityDays: Math.max(1, Math.round(numf(fd, "defaultValidityDays")) || 30),
      defaultConditions: str(fd, "defaultConditions"),
      defaultWarranty: str(fd, "defaultWarranty"),
      defaultNotes: str(fd, "defaultNotes"),
    },
  });
  revalidatePath("/app", "layout");
  redirect("/app/configuracoes?salvo=1");
}

/* ---------------- Notificações ---------------- */

export async function markAllNotificationsRead() {
  const { companyId } = await requireSession();
  await db.notification.updateMany({ where: { companyId, read: false }, data: { read: true } });
  revalidatePath("/app", "layout");
}
