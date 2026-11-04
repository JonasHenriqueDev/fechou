import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ORDER_KIND, ORDER_STATUS, QUOTE_STATUS } from "@/lib/constants";
import { date, dateTime, money, onlyDigits, whatsappLink, isOverdue } from "@/lib/format";
import { round2 } from "@/lib/calc";
import { Badge, PageHeader, Stat } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession();
  const { id } = await params;
  const c = await db.client.findFirst({
    where: { id, companyId },
    include: {
      quotes: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, include: { installments: true, payments: true } },
      appointments: { orderBy: { start: "desc" }, take: 10 },
    },
  });
  if (!c) notFound();

  const now = new Date();
  const activeOrders = c.orders.filter((o) => o.status !== "CANCELED");
  const paid = round2(activeOrders.reduce((s, o) => s + o.payments.reduce((a, p) => a + p.amount, 0), 0));
  const totalOrders = round2(activeOrders.reduce((s, o) => s + o.total, 0));
  const overdue = round2(
    activeOrders.flatMap((o) => o.installments).filter((i) => !i.paidAt && isOverdue(i.dueDate, now)).reduce((s, i) => s + i.amount - i.paidAmount, 0),
  );
  const receivable = round2(Math.max(0, totalOrders - paid));
  const inProgress = activeOrders.filter((o) => ["OPEN", "IN_PROGRESS"].includes(o.status)).length;

  return (
    <div>
      <PageHeader
        title={c.name}
        back="/app/clientes"
        subtitle={[c.document, c.address].filter(Boolean).join(" · ") || undefined}
        actions={
          <Link href={`/app/clientes/${c.id}/editar`} className="btn-secondary">
            <Icon name="edit" className="h-4 w-4" /> Editar
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {c.phone && (
          <a href={whatsappLink(c.phone, `Olá, ${c.name.split(" ")[0]}!`)} target="_blank" className="btn-whatsapp">
            <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
          </a>
        )}
        {c.phone && (
          <a href={`tel:${onlyDigits(c.phone)}`} className="btn-secondary">
            <Icon name="phone" className="h-4 w-4" /> Ligar
          </a>
        )}
        {c.email && (
          <a href={`mailto:${c.email}`} className="btn-secondary">
            <Icon name="mail" className="h-4 w-4" /> E-mail
          </a>
        )}
        <Link href={`/app/orcamentos/novo?cliente=${c.id}`} className="btn-primary">
          <Icon name="plus" className="h-4 w-4" /> Orçamento
        </Link>
        <Link href={`/app/pedidos/novo?cliente=${c.id}`} className="btn-secondary">Pedido</Link>
        <Link href={`/app/agenda/novo?cliente=${c.id}`} className="btn-secondary">
          <Icon name="calendar" className="h-4 w-4" /> Agendar
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Valor pago" value={money(paid)} tone="green" />
        <Stat label="A receber" value={money(receivable)} tone="amber" />
        <Stat label="Em atraso" value={money(overdue)} tone="red" />
        <Stat label="Pedidos em andamento" value={String(inProgress)} hint={`${c.quotes.length} orçamento(s) enviados`} tone="blue" />
      </div>

      {c.notes && <div className="card mt-5 whitespace-pre-line p-4 text-sm text-slate-700">{c.notes}</div>}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card">
          <h2 className="border-b border-slate-100 px-4 py-3 font-semibold">Orçamentos</h2>
          {c.quotes.length === 0 ? <p className="p-4 text-sm text-slate-500">Nenhum.</p> : (
            <div className="stagger divide-y divide-slate-100">
              {c.quotes.map((q) => (
                <Link key={q.id} href={`/app/orcamentos/${q.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50">
                  <span>nº {q.code} · {date(q.createdAt)}</span>
                  <span className="flex items-center gap-2"><b>{money(q.total)}</b><Badge map={QUOTE_STATUS} value={q.status} /></span>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="card">
          <h2 className="border-b border-slate-100 px-4 py-3 font-semibold">Pedidos e OS</h2>
          {c.orders.length === 0 ? <p className="p-4 text-sm text-slate-500">Nenhum.</p> : (
            <div className="stagger divide-y divide-slate-100">
              {c.orders.map((o) => (
                <Link key={o.id} href={`/app/pedidos/${o.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50">
                  <span>{ORDER_KIND[o.kind]} nº {o.code}</span>
                  <span className="flex items-center gap-2"><b>{money(o.total)}</b><Badge map={ORDER_STATUS} value={o.status} /></span>
                </Link>
              ))}
            </div>
          )}
        </section>
        {c.appointments.length > 0 && (
          <section className="card lg:col-span-2">
            <h2 className="border-b border-slate-100 px-4 py-3 font-semibold">Agenda</h2>
            <div className="stagger divide-y divide-slate-100">
              {c.appointments.map((a) => (
                <Link key={a.id} href={`/app/agenda/${a.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50">
                  <span>{a.title}</span>
                  <span className="text-slate-500">{dateTime(a.start)}{a.done && " ✓"}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
