import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { INCOME_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { date, inputDate, money } from "@/lib/format";
import { Empty, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { Icon } from "@/components/Icon";
import { createStandaloneReceipt } from "@/actions/records";

export const metadata = { title: "Recibos" };

export default async function Page() {
  const { companyId } = await requireSession();
  const [receipts, clients] = await Promise.all([
    db.receipt.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 200, include: { payment: { include: { client: true } } } }),
    db.client.findMany({ where: { companyId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Recibos" subtitle="Gerados automaticamente a cada recebimento — ou emita um recibo avulso." />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          {receipts.length === 0 ? (
            <Empty icon="receipt" title="Nenhum recibo" text="Ao registrar um pagamento em um pedido, o recibo é gerado na hora." />
          ) : (
            <div className="card divide-y divide-slate-100">
              {receipts.map((r) => (
                <a key={r.id} href={`/r/${r.token}`} target="_blank" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">Recibo nº {r.code} · {r.payment.client?.name ?? "Sem cliente"}</div>
                    <div className="truncate text-xs text-slate-500">{date(r.payment.paidAt)} · {r.description}</div>
                  </div>
                  <div className="font-semibold">{money(r.payment.amount)}</div>
                </a>
              ))}
            </div>
          )}
        </div>

        <form action={createStandaloneReceipt} className="card space-y-3 self-start p-4">
          <h2 className="flex items-center gap-2 font-semibold"><Icon name="receipt" /> Recibo avulso</h2>
          <label className="block">
            <span className="label">Cliente</span>
            <select name="clientId" className="input">
              <option value="">—</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Referente a *</span>
            <input name="description" required className="input" placeholder="Ex.: Manutenção preventiva" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="label">Valor *</span>
              <input name="amount" type="number" step="0.01" min="0.01" required className="input" />
            </label>
            <label>
              <span className="label">Data</span>
              <input name="paidAt" type="date" defaultValue={inputDate(new Date())} className="input" />
            </label>
            <label>
              <span className="label">Forma</span>
              <select name="method" className="input">
                {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Categoria</span>
              <select name="category" className="input">
                {INCOME_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <p className="text-xs text-slate-500">O valor também entra como receita no financeiro.</p>
          <SubmitButton className="btn-primary w-full">Emitir recibo</SubmitButton>
        </form>
      </div>
    </div>
  );
}
