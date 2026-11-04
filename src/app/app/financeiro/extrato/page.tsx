import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { date, dateTime, money } from "@/lib/format";
import { monthRange } from "@/lib/period";
import { round2 } from "@/lib/calc";
import { AutoPrint, PrintButton } from "@/components/client";

export const metadata = { title: "Extrato financeiro" };

/** Página de impressão: fica fora do visual do app graças às classes no-print/print-area. */
export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { company } = await requireCompany();
  const p = monthRange((await searchParams).mes);
  const [tx, prevI, prevE] = await Promise.all([
    db.transaction.findMany({ where: { companyId: company.id, date: { gte: p.start, lt: p.end } }, orderBy: { date: "asc" } }),
    db.transaction.aggregate({ where: { companyId: company.id, type: "INCOME", date: { lt: p.start } }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { companyId: company.id, type: "EXPENSE", date: { lt: p.start } }, _sum: { amount: true } }),
  ]);
  const opening = round2((prevI._sum.amount ?? 0) - (prevE._sum.amount ?? 0));
  let bal = opening;
  const income = tx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = tx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <AutoPrint />
      <div className="no-print mb-3 flex justify-end"><PrintButton className="btn-primary" /></div>
      <div className="card paper print-area p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-bold">{company.name}</div>
            {company.document && <div className="text-sm text-slate-500">CPF/CNPJ {company.document}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase text-slate-500">Extrato financeiro</div>
            <div className="font-bold capitalize">{p.label}</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-300 text-left text-xs uppercase text-slate-500">
            <tr><th className="py-2">Data</th><th>Descrição</th><th>Categoria</th><th className="text-right">Valor</th><th className="text-right">Saldo</th></tr>
          </thead>
          <tbody className="stagger divide-y divide-slate-100">
            <tr className="text-slate-500"><td className="py-1.5" colSpan={4}>Saldo anterior</td><td className="text-right">{money(opening)}</td></tr>
            {tx.map((t) => {
              bal = round2(bal + (t.type === "INCOME" ? t.amount : -t.amount));
              return (
                <tr key={t.id}>
                  <td className="py-1.5">{date(t.date)}</td>
                  <td>{t.description}</td>
                  <td className="text-slate-500">{t.category}</td>
                  <td className={`text-right ${t.type === "INCOME" ? "text-emerald-700" : "text-red-600"}`}>{t.type === "INCOME" ? "" : "−"}{money(t.amount)}</td>
                  <td className="text-right">{money(bal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 ml-auto w-64 space-y-1 border-t border-slate-300 pt-2 text-sm">
          <div className="flex justify-between"><span>Receitas</span><b className="text-emerald-700">{money(income)}</b></div>
          <div className="flex justify-between"><span>Despesas</span><b className="text-red-600">{money(expense)}</b></div>
          <div className="flex justify-between"><span>Saldo final</span><b>{money(bal)}</b></div>
        </div>
        <div className="mt-6 text-[11px] text-slate-400">Gerado em {dateTime(new Date())}</div>
      </div>
    </div>
  );
}
