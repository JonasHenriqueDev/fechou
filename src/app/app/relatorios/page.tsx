import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ORDER_KIND, ORDER_STATUS, PAYMENT_METHODS } from "@/lib/constants";
import { date, money, num } from "@/lib/format";
import { monthRange } from "@/lib/period";
import { round2 } from "@/lib/calc";
import { Badge, PageHeader, Stat } from "@/components/ui";
import { PrintButton } from "@/components/client";

export const metadata = { title: "Relatórios" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { companyId } = await requireSession();
  const p = monthRange((await searchParams).mes);
  const range = { gte: p.start, lt: p.end };

  const [orders, payments, quotes] = await Promise.all([
    db.order.findMany({ where: { companyId, createdAt: range, status: { not: "CANCELED" } }, include: { items: true, client: true }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({ where: { companyId, paidAt: range } }),
    db.quote.findMany({ where: { companyId, createdAt: range }, select: { status: true, total: true } }),
  ]);

  const sold = round2(orders.reduce((s, o) => s + o.total, 0));
  const cost = round2(orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.unitCost * i.quantity, 0), 0));
  const ticket = orders.length ? sold / orders.length : 0;
  const received = round2(payments.reduce((s, x) => s + x.amount, 0));
  const approved = quotes.filter((q) => ["APPROVED", "CONVERTED"].includes(q.status)).length;
  const conversion = quotes.length ? (approved / quotes.length) * 100 : 0;

  const rank = (type: string) => {
    const m = new Map<string, { qty: number; revenue: number; unit: string }>();
    orders.flatMap((o) => o.items).filter((i) => (type === "SERVICE" ? i.type === "SERVICE" : i.type !== "SERVICE")).forEach((i) => {
      const cur = m.get(i.name) ?? { qty: 0, revenue: 0, unit: i.unit };
      cur.qty += i.quantity;
      cur.revenue += i.quantity * i.unitPrice;
      m.set(i.name, cur);
    });
    return [...m.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);
  };
  const byMethod = new Map<string, number>();
  payments.forEach((x) => byMethod.set(x.method, (byMethod.get(x.method) ?? 0) + x.amount));

  return (
    <div>
      <PageHeader
        title="Relatórios"
        subtitle={
          <span className="flex items-center gap-2 capitalize">
            <Link href={`/app/relatorios?mes=${p.prevKey}`} className="rounded px-1.5 hover:bg-slate-200 no-print">‹</Link>
            {p.label}
            <Link href={`/app/relatorios?mes=${p.nextKey}`} className="rounded px-1.5 hover:bg-slate-200 no-print">›</Link>
          </span>
        }
        actions={<span className="no-print"><PrintButton label="Imprimir / PDF" /></span>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Vendido (pedidos)" value={money(sold)} hint={`${orders.length} pedido(s)`} tone="blue" />
        <Stat label="Recebido" value={money(received)} hint={`${payments.length} pagamento(s)`} tone="green" />
        <Stat label="Lucro bruto estimado" value={money(sold - cost)} hint={`Custo ${money(cost)}`} tone={sold - cost >= 0 ? "green" : "red"} />
        <Stat label="Ticket médio" value={money(ticket)} hint={`Conversão de orçamentos ${conversion.toFixed(0)}% (${approved}/${quotes.length})`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {[["SERVICE", "Serviços mais vendidos"], ["PRODUCT", "Produtos mais vendidos"]].map(([t, title]) => (
          <section key={t} className="card avoid-break">
            <h2 className="border-b border-slate-100 px-4 py-3 font-semibold">{title}</h2>
            {rank(t).length === 0 ? <p className="p-4 text-sm text-slate-500">Sem vendas no período.</p> : (
              <table className="w-full text-sm">
                <tbody className="stagger divide-y divide-slate-100">
                  {rank(t).map(([name, v], i) => (
                    <tr key={name}>
                      <td className="w-8 px-4 py-2 text-slate-400">{i + 1}º</td>
                      <td className="py-2">{name}</td>
                      <td className="py-2 text-right text-slate-500">{num(v.qty)} {v.unit}</td>
                      <td className="px-4 py-2 text-right font-semibold">{money(v.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}

        <section className="card avoid-break">
          <h2 className="border-b border-slate-100 px-4 py-3 font-semibold">Recebimentos por forma de pagamento</h2>
          {byMethod.size === 0 ? <p className="p-4 text-sm text-slate-500">Nenhum recebimento.</p> : (
            <div className="space-y-3 p-4">
              {[...byMethod.entries()].sort((a, b) => b[1] - a[1]).map(([m, v]) => (
                <div key={m}>
                  <div className="flex justify-between text-sm"><span>{PAYMENT_METHODS[m] ?? m}</span><b>{money(v)}</b></div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(v / (received || 1)) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card avoid-break">
          <h2 className="border-b border-slate-100 px-4 py-3 font-semibold">Pedidos do período</h2>
          {orders.length === 0 ? <p className="p-4 text-sm text-slate-500">Nenhum pedido.</p> : (
            <div className="stagger divide-y divide-slate-100">
              {orders.map((o) => (
                <Link key={o.id} href={`/app/pedidos/${o.id}`} className="flex items-center justify-between gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                  <span className="min-w-0 truncate">{date(o.createdAt)} · {ORDER_KIND[o.kind]} nº {o.code} · {o.client?.name ?? "—"}</span>
                  <span className="flex items-center gap-2"><b>{money(o.total)}</b><Badge map={ORDER_STATUS} value={o.status} /></span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
