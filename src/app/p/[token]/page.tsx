import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { trackOrderView } from "@/lib/tracking";
import { ORDER_KIND, ORDER_STATUS, PAYMENT_METHODS } from "@/lib/constants";
import { date, money, isOverdue } from "@/lib/format";
import { round2 } from "@/lib/calc";
import { DocumentView } from "@/components/DocumentView";
import { PortalChrome } from "@/components/PortalChrome";
import { PixBox } from "@/components/PixBox";
import { Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedido", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const o = await db.order.findUnique({
    where: { token },
    include: {
      company: true, client: true, items: { orderBy: { position: "asc" } },
      installments: { orderBy: { number: "asc" } },
      payments: { orderBy: { paidAt: "desc" }, include: { receipt: true } },
    },
  });
  if (!o) notFound();
  await trackOrderView(o, o.client?.name);

  const label = ORDER_KIND[o.kind];
  const paid = round2(o.payments.reduce((s, p) => s + p.amount, 0));
  const remaining = round2(Math.max(0, o.total - paid));
  const next = o.installments.find((i) => !i.paidAt);
  const pixAmount = next ? round2(next.amount - next.paidAmount) : remaining;
  const now = new Date();

  return (
    <PortalChrome company={o.company} whatsText={`Olá! Tenho uma dúvida sobre ${label.toLowerCase()} nº ${o.code}.`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <aside className="space-y-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label} nº {o.code}</div>
              <Badge map={ORDER_STATUS} value={o.status} />
            </div>
            <div className="text-3xl font-bold">{money(o.total)}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">Pago<br /><b>{money(paid)}</b></div>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-800">Em aberto<br /><b>{money(remaining)}</b></div>
            </div>
            <a href={`/p/${token}/pdf`} target="_blank" className="btn-secondary mt-3 w-full">
              <Icon name="download" className="h-4 w-4" /> Baixar PDF
            </a>
          </div>

          {o.installments.length > 0 && (
            <div className="card p-4">
              <div className="mb-2 font-semibold">Parcelas</div>
              <div className="divide-y divide-slate-100 text-sm">
                {o.installments.map((i) => (
                  <div key={i.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium">{i.number}ª · {money(i.amount)}</div>
                      <div className={`text-xs ${!i.paidAt && isOverdue(i.dueDate, now) ? "text-red-600" : "text-slate-500"}`}>Vencimento {date(i.dueDate)}</div>
                    </div>
                    {i.paidAt ? <span className="badge bg-emerald-100 text-emerald-700">Paga</span> : <span className="badge bg-slate-100 text-slate-600">Aberta</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {remaining > 0 && o.status !== "CANCELED" && (
            <PixBox company={o.company} amount={pixAmount} txid={`PED${o.code}`} title={next ? `Pagar ${next.number}ª parcela com Pix` : "Pagar com Pix"} />
          )}

          {o.payments.length > 0 && (
            <div className="card p-4">
              <div className="mb-2 font-semibold">Pagamentos e recibos</div>
              <div className="divide-y divide-slate-100 text-sm">
                {o.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium">{money(p.amount)}</div>
                      <div className="text-xs text-slate-500">{date(p.paidAt)} · {PAYMENT_METHODS[p.method]}</div>
                    </div>
                    {p.receipt && <a href={`/r/${p.receipt.token}`} className="btn-secondary btn-sm">Recibo</a>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <div className="lg:order-1">
          <DocumentView
            company={o.company}
            client={o.client}
            docLabel={label}
            code={o.code}
            issueDate={o.createdAt}
            title={o.title}
            items={o.items}
            discountType={o.discountType}
            discountValue={o.discountValue}
            deliveryFee={o.deliveryFee}
            sections={[
              { title: "Data de entrega / execução", text: o.scheduledDate ? date(o.scheduledDate) : null },
              { title: "Observações", text: o.notes },
            ]}
          />
        </div>
      </div>
    </PortalChrome>
  );
}
