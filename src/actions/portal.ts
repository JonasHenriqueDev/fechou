"use server";

// Ações públicas do portal do cliente — autorizadas apenas pelo token do link.

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type PortalState = { error?: string; ok?: boolean } | undefined;

export async function approveQuote(token: string, _: PortalState, fd: FormData): Promise<PortalState> {
  const name = String(fd.get("name") ?? "").trim();
  const signature = String(fd.get("signature") ?? "");
  if (!name) return { error: "Informe seu nome." };
  if (!signature.startsWith("data:image/png")) return { error: "Faça sua assinatura no quadro." };
  const q = await db.quote.findUnique({ where: { token } });
  if (!q || ["APPROVED", "CONVERTED"].includes(q.status)) return { error: "Este orçamento não pode mais ser aprovado." };
  if (q.validUntil && q.validUntil.getTime() + 86400000 < Date.now()) return { error: "Este orçamento está vencido. Fale com a empresa." };
  await db.quote.update({
    where: { id: q.id },
    data: { status: "APPROVED", approvedAt: new Date(), approvedByName: name, clientSignature: signature, rejectedAt: null, rejectReason: null },
  });
  await db.notification.create({
    data: { companyId: q.companyId, type: "QUOTE_APPROVED", message: `${name} aprovou o orçamento nº ${q.code}`, link: `/app/orcamentos/${q.id}` },
  });
  revalidatePath(`/o/${token}`);
  return { ok: true };
}

export async function rejectQuote(token: string, _: PortalState, fd: FormData): Promise<PortalState> {
  const reason = String(fd.get("reason") ?? "").trim();
  const q = await db.quote.findUnique({ where: { token } });
  if (!q || ["APPROVED", "CONVERTED", "REJECTED"].includes(q.status)) return { error: "Ação indisponível." };
  await db.quote.update({ where: { id: q.id }, data: { status: "REJECTED", rejectedAt: new Date(), rejectReason: reason || null } });
  await db.notification.create({
    data: {
      companyId: q.companyId, type: "QUOTE_REJECTED",
      message: `Orçamento nº ${q.code} foi recusado${reason ? `: “${reason}”` : ""}`, link: `/app/orcamentos/${q.id}`,
    },
  });
  revalidatePath(`/o/${token}`);
  return { ok: true };
}
