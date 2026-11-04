import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Consultado a cada minuto pelo navegador (components/Reminders.tsx):
 * devolve lembretes da agenda que já devem disparar e notificações não lidas recentes.
 */
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ reminders: [], notifications: [] }, { status: 401 });
  const now = Date.now();
  const [appts, notifications] = await Promise.all([
    db.appointment.findMany({
      where: { companyId: s.companyId, done: false, remindMin: { gt: 0 }, start: { gte: new Date(now - 3600_000), lte: new Date(now + 86400_000) } },
      include: { client: { select: { name: true } } },
    }),
    db.notification.findMany({
      where: { companyId: s.companyId, read: false, createdAt: { gte: new Date(now - 86400_000) } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const reminders = appts
    .filter((a) => a.start.getTime() - a.remindMin * 60_000 <= now)
    .map((a) => ({ id: a.id, title: a.title, start: a.start, client: a.client?.name ?? null }));
  return NextResponse.json({
    reminders,
    notifications: notifications.map((n) => ({ id: n.id, message: n.message, link: n.link })),
  });
}
