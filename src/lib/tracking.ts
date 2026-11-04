import "server-only";
import { db } from "./db";
import { getSession } from "./auth";

/** Registra a abertura do portal pelo cliente (ignora o próprio dono logado). */
export async function trackQuoteView(q: { id: string; companyId: string; code: string; status: string; viewCount: number }, clientName?: string | null) {
  const s = await getSession();
  if (s?.companyId === q.companyId) return;
  await db.quote.update({
    where: { id: q.id },
    data: {
      viewCount: { increment: 1 },
      viewedAt: new Date(),
      ...(["DRAFT", "SENT"].includes(q.status) ? { status: "VIEWED" } : {}),
    },
  });
  if (q.viewCount === 0) {
    await db.notification.create({
      data: {
        companyId: q.companyId, type: "QUOTE_VIEWED",
        message: `${clientName ?? "O cliente"} abriu o orçamento nº ${q.code}`, link: `/app/orcamentos/${q.id}`,
      },
    });
  }
}

export async function trackOrderView(o: { id: string; companyId: string; code: string }, clientName?: string | null) {
  const s = await getSession();
  if (s?.companyId === o.companyId) return;
  const recent = await db.notification.findFirst({
    where: { companyId: o.companyId, type: "ORDER_VIEWED", link: `/app/pedidos/${o.id}`, createdAt: { gte: new Date(Date.now() - 6 * 3600_000) } },
  });
  if (!recent)
    await db.notification.create({
      data: { companyId: o.companyId, type: "ORDER_VIEWED", message: `${clientName ?? "O cliente"} abriu o pedido nº ${o.code}`, link: `/app/pedidos/${o.id}` },
    });
}
