import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { Empty, PageHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { markAllNotificationsRead } from "@/actions/records";

export const metadata = { title: "Notificações" };

const ICON: Record<string, string> = { QUOTE_VIEWED: "eye", QUOTE_APPROVED: "check", QUOTE_REJECTED: "x", ORDER_VIEWED: "eye" };

export default async function Page() {
  const { companyId } = await requireSession();
  const list = await db.notification.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Notificações"
        subtitle="Saiba quando o cliente abrir, aprovar ou recusar"
        actions={
          list.some((n) => !n.read) && (
            <form action={markAllNotificationsRead}>
              <button className="btn-secondary">Marcar todas como lidas</button>
            </form>
          )
        }
      />
      {list.length === 0 ? (
        <Empty icon="bell" title="Nenhuma notificação" text="Quando um cliente abrir ou aprovar um orçamento, você verá aqui." />
      ) : (
        <div className="card divide-y divide-slate-100">
          {list.map((n) => (
            <Link key={n.id} href={n.link ?? "#"} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 ${n.read ? "" : "bg-brand-50/50"}`}>
              <div className={`grid h-9 w-9 flex-none place-items-center rounded-full ${n.type === "QUOTE_APPROVED" ? "bg-emerald-100 text-emerald-700" : n.type === "QUOTE_REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                <Icon name={ICON[n.type] ?? "bell"} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${n.read ? "" : "font-semibold"}`}>{n.message}</div>
                <div className="text-xs text-slate-500">{dateTime(n.createdAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
