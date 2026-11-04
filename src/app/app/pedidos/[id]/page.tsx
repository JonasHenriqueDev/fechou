import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { ORDER_KIND, ORDER_STATUS, PAYMENT_METHODS } from "@/lib/constants";
import { date, inputDate, money, isOverdue } from "@/lib/format";
import { round2 } from "@/lib/calc";
import { Badge, PageHeader } from "@/components/ui";
import { DocumentView } from "@/components/DocumentView";
import { ConfirmSubmit, ShareButton, SubmitButton, WhatsAppShare } from "@/components/client";
import { Icon } from "@/components/Icon";
import { deleteOrder, deletePayment, registerPayment, setOrderStatus, setPaymentPlan } from "@/actions/orders";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { company } = await requireCompany();
  const { id } = await params;
  const o = await db.order.findFirst({
    where: { id, companyId: company.id },
    include: {
      client: true, quote: true, items: { orderBy: { position: "asc" } },
      installments: { orderBy: { number: "asc" } },
      payments: { orderBy: { paidAt: "desc" }, include: { receipt: true, installment: true } },
    },
  });
  if (!o) notFound();

  const paid = round2(o.payments.reduce((s, p) => s + p.amount, 0));
  const remaining = round2(Math.max(0, o.total - paid));
  const label = ORDER_KIND[o.kind];
  const portal = `/p/${o.token}`;
  const msg = `Olá${o.client ? `, ${o.client.name.split(" ")[0]}` : ""}! Segue ${label.toLowerCase()} nº ${o.code} de ${company.name} (${money(o.total)}). Acompanhe parcelas e pague via Pix pelo link:`;
  const nextOpen = o.installments.find((i) => !i.paidAt);
  const now = new Date();

  return (
    <div>
      <PageHeader
        title={`${label} nº ${o.code}`}
        back="/app/pedidos"
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge map={ORDER_STATUS} value={o.status} />
            {o.quote && <Link href={`/app/orcamentos/${o.quote.id}`} className="text-brand-600">do orçamento nº {o.quote.code}</Link>}
          </span>
        }
        actions={
          <Link href={`/app/pedidos/${o.id}/editar`} className="btn-secondary">
            <Icon name="edit" className="h-4 w-4" /> Editar
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="order-2 space-y-5 lg:order-1">
          {/* Financeiro do pedido */}
          <section className="card p-4 sm:p-5">
            <div className="mb-4 grid grid-cols-3 gap-2 text-center">
              <Mini label="Total" value={money(o.total)} />
              <Mini label="Pago" value={money(paid)} tone="text-emerald-600" />
              <Mini label="Falta" value={money(remaining)} tone={remaining > 0 ? "text-amber-600" : "text-slate-400"} />
            </div>

            <h3 className="mb-2 font-semibold">Parcelas</h3>
            {o.installments.length === 0 ? (
              <p className="mb-3 text-sm text-slate-500">Sem plano de pagamento definido. Defina à vista ou parcelado abaixo.</p>
            ) : (
              <div className="mb-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {o.installments.map((i) => {
                  const late = !i.paidAt && isOverdue(i.dueDate, now);
                  return (
                    <div key={i.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium">Parcela {i.number} · {money(i.amount)}</div>
                        <div className={`text-xs ${late ? "font-semibold text-red-600" : "text-slate-500"}`}>
                          Vence {date(i.dueDate)}{late && " · atrasada"}
                          {i.paidAmount > 0 && !i.paidAt && ` · pago ${money(i.paidAmount)}`}
                        </div>
                      </div>
                      {i.paidAt ? <span className="badge bg-emerald-100 text-emerald-700">Paga</span> : <span className="badge bg-slate-100 text-slate-600">Em aberto</span>}
                    </div>
                  );
                })}
              </div>
            )}

            <details className="rounded-xl border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold">Definir plano de pagamento</summary>
              <form action={setPaymentPlan.bind(null, o.id)} className="mt-3 grid grid-cols-2 gap-2">
                <label>
                  <span className="label">Entrada (R$)</span>
                  <input name="entry" type="number" step="0.01" min="0" defaultValue={0} className="input" />
                </label>
                <label>
                  <span className="label">Nº de parcelas</span>
                  <input name="count" type="number" min="1" max="48" defaultValue={1} className="input" />
                </label>
                <label>
                  <span className="label">1º vencimento</span>
                  <input name="firstDue" type="date" defaultValue={inputDate(now)} className="input" />
                </label>
                <label>
                  <span className="label">Intervalo (dias)</span>
                  <input name="interval" type="number" min="1" defaultValue={30} className="input" />
                </label>
                <p className="col-span-2 text-xs text-slate-500">Parcelas já com pagamento são mantidas; o restante é redistribuído.</p>
                <SubmitButton className="btn-secondary col-span-2">Gerar parcelas</SubmitButton>
              </form>
            </details>

            {remaining > 0 && o.status !== "CANCELED" && (
              <form action={registerPayment.bind(null, o.id)} className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                <div className="col-span-2 font-semibold">Registrar recebimento</div>
                <label>
                  <span className="label">Valor</span>
                  <input name="amount" type="number" step="0.01" min="0.01" defaultValue={round2(nextOpen ? nextOpen.amount - nextOpen.paidAmount : remaining)} className="input" required />
                </label>
                <label>
                  <span className="label">Forma</span>
                  <select name="method" className="input" defaultValue="PIX">
                    {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label">Data</span>
                  <input name="paidAt" type="date" defaultValue={inputDate(now)} className="input" />
                </label>
                <label>
                  <span className="label">Parcela</span>
                  <select name="installmentId" className="input" defaultValue={nextOpen?.id ?? ""}>
                    <option value="">—</option>
                    {o.installments.filter((i) => !i.paidAt).map((i) => (
                      <option key={i.id} value={i.id}>Parcela {i.number}</option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" name="openReceipt" defaultChecked className="h-4 w-4" /> Abrir recibo após salvar
                </label>
                <SubmitButton className="btn-success col-span-2">Confirmar recebimento e gerar recibo</SubmitButton>
              </form>
            )}

            {o.payments.length > 0 && (
              <>
                <h3 className="mb-2 mt-5 font-semibold">Recebimentos</h3>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {o.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium">{money(p.amount)} · {PAYMENT_METHODS[p.method] ?? p.method}</div>
                        <div className="text-xs text-slate-500">{date(p.paidAt)}{p.installment && ` · parcela ${p.installment.number}`}</div>
                      </div>
                      <div className="flex gap-1">
                        {p.receipt && (
                          <a href={`/r/${p.receipt.token}`} target="_blank" className="btn-secondary btn-sm">
                            <Icon name="receipt" className="h-4 w-4" /> Recibo
                          </a>
                        )}
                        <form action={deletePayment.bind(null, p.id)}>
                          <ConfirmSubmit message="Excluir este recebimento (e o recibo)?" className="btn-danger btn-sm">
                            <Icon name="trash" className="h-4 w-4" />
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <DocumentView
            company={company}
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

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <div className="card space-y-2 p-4">
            <h2 className="font-semibold">Enviar ao cliente</h2>
            <WhatsAppShare phone={o.client?.phone} message={msg} path={portal} className="btn-whatsapp w-full" />
            <div className="grid grid-cols-2 gap-2">
              <a href={portal} target="_blank" className="btn-secondary">
                <Icon name="eye" className="h-4 w-4" /> Portal
              </a>
              <a href={`${portal}/pdf`} target="_blank" className="btn-secondary">
                <Icon name="download" className="h-4 w-4" /> PDF
              </a>
            </div>
            <ShareButton url={portal} title={`${label} ${o.code}`} />
          </div>

          <div className="card space-y-2 p-4">
            <h2 className="font-semibold">Status</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ORDER_STATUS).map(([k, s]) => (
                <form key={k} action={setOrderStatus.bind(null, o.id, k)}>
                  <button className={`w-full rounded-xl border px-2 py-2 text-xs font-semibold ${o.status === k ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {s.label}
                  </button>
                </form>
              ))}
            </div>
            <p className="text-xs text-slate-500">Produtos com controle de estoque são baixados ao criar o pedido e devolvidos se ele for cancelado.</p>
          </div>

          <form action={deleteOrder.bind(null, o.id)}>
            <ConfirmSubmit message="Excluir este pedido, suas parcelas e recebimentos?" className="btn-danger w-full">
              <Icon name="trash" className="h-4 w-4" /> Excluir pedido
            </ConfirmSubmit>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Mini({ label, value, tone = "text-slate-900" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <div className="text-[11px] font-semibold uppercase text-slate-500">{label}</div>
      <div className={`text-sm font-bold sm:text-base ${tone}`}>{value}</div>
    </div>
  );
}
