import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { date, money, isOverdue } from "@/lib/format";
import { monthRange } from "@/lib/period";
import { round2 } from "@/lib/calc";
import { Chip, PageHeader, Stat } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client";
import { Icon } from "@/components/Icon";
import { deleteTransaction } from "@/actions/records";

export const metadata = { title: "Financeiro" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string; aba?: string }> }) {
  const { companyId } = await requireSession();
  const { mes, aba = "fluxo" } = await searchParams;
  const p = monthRange(mes);
  const now = new Date();

  const [tx, open, prevIncome, prevExpense] = await Promise.all([
    db.transaction.findMany({ where: { companyId, date: { gte: p.start, lt: p.end } }, orderBy: { date: "desc" } }),
    db.installment.findMany({
      where: { paidAt: null, order: { companyId, status: { not: "CANCELED" } } },
      orderBy: { dueDate: "asc" },
      include: { order: { include: { client: true } } },
    }),
    db.transaction.aggregate({ where: { companyId, type: "INCOME", date: { lt: p.start } }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { companyId, type: "EXPENSE", date: { lt: p.start } }, _sum: { amount: true } }),
  ]);

  const income = round2(tx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0));
  const expense = round2(tx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0));
  const opening = round2((prevIncome._sum.amount ?? 0) - (prevExpense._sum.amount ?? 0));
  const receivable = round2(open.reduce((s, i) => s + i.amount - i.paidAmount, 0));
  const overdue = round2(open.filter((i) => isOverdue(i.dueDate, now)).reduce((s, i) => s + i.amount - i.paidAmount, 0));

  const byCat = (type: string) => {
    const m = new Map<string, number>();
    tx.filter((t) => t.type === type).forEach((t) => m.set(t.category, (m.get(t.category) ?? 0) + t.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  // Saldo acumulado por dia (fluxo de caixa)
  const days = new Map<string, { in: number; out: number }>();
  [...tx].reverse().forEach((t) => {
    const k = date(t.date);
    const d = days.get(k) ?? { in: 0, out: 0 };
    if (t.type === "INCOME") d.in += t.amount;
    else d.out += t.amount;
    days.set(k, d);
  });
  let running = opening;
  const flow = [...days.entries()].map(([k, d]) => {
    running = round2(running + d.in - d.out);
    return { day: k, ...d, balance: running };
  });

  const q = (extra: string) => `/app/financeiro?mes=${p.key}&aba=${extra}`;

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle={
          <span className="flex items-center gap-2 capitalize">
            <Link href={`/app/financeiro?mes=${p.prevKey}&aba=${aba}`} className="rounded px-1.5 hover:bg-slate-200">‹</Link>
            {p.label}
            <Link href={`/app/financeiro?mes=${p.nextKey}&aba=${aba}`} className="rounded px-1.5 hover:bg-slate-200">›</Link>
          </span>
        }
        actions={
          <>
            <Link href="/app/financeiro/novo?tipo=INCOME" className="btn-success">+ Receita</Link>
            <Link href="/app/financeiro/novo?tipo=EXPENSE" className="btn-danger">− Despesa</Link>
            <a href={`/app/financeiro/extrato?mes=${p.key}`} target="_blank" className="btn-secondary">
              <Icon name="download" className="h-4 w-4" /> Extrato PDF
            </a>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Receitas" value={money(income)} tone="green" />
        <Stat label="Despesas" value={money(expense)} tone="red" />
        <Stat label="Resultado do mês" value={money(income - expense)} tone={income - expense >= 0 ? "blue" : "red"} hint={`Saldo em caixa: ${money(opening + income - expense)}`} />
        <Stat label="A receber" value={money(receivable)} tone="amber" hint={overdue > 0 ? `${money(overdue)} em atraso` : "Nada em atraso"} />
      </div>

      <div className="-mx-4 my-4 flex gap-2 overflow-x-auto px-4">
        <Chip href={q("fluxo")} active={aba === "fluxo"}>Lançamentos</Chip>
        <Chip href={q("caixa")} active={aba === "caixa"}>Fluxo de caixa</Chip>
        <Chip href={q("categorias")} active={aba === "categorias"}>Por categoria</Chip>
        <Chip href={q("receber")} active={aba === "receber"}>Contas a receber</Chip>
      </div>

      {aba === "fluxo" && (
        <div className="card divide-y divide-slate-100">
          {tx.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Nenhum lançamento neste mês.</p>}
          {tx.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`grid h-9 w-9 flex-none place-items-center rounded-full text-lg font-bold ${t.type === "INCOME" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                {t.type === "INCOME" ? "+" : "−"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.description}</div>
                <div className="text-xs text-slate-500">{date(t.date)} · {t.category}{t.paymentId && " · automático"}</div>
              </div>
              <div className={`font-semibold ${t.type === "INCOME" ? "text-emerald-600" : "text-red-600"}`}>{money(t.amount)}</div>
              {!t.paymentId && (
                <div className="flex gap-1">
                  <Link href={`/app/financeiro/${t.id}`} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Editar"><Icon name="edit" className="h-4 w-4" /></Link>
                  <form action={deleteTransaction.bind(null, t.id)}>
                    <ConfirmSubmit message="Excluir lançamento?" className="p-1 text-slate-400 hover:text-red-600"><Icon name="trash" className="h-4 w-4" /></ConfirmSubmit>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {aba === "caixa" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-2">Dia</th><th className="px-4 py-2 text-right">Entradas</th><th className="px-4 py-2 text-right">Saídas</th><th className="px-4 py-2 text-right">Saldo</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="text-slate-500"><td className="px-4 py-2">Saldo anterior</td><td /><td /><td className="px-4 py-2 text-right">{money(opening)}</td></tr>
              {flow.map((f) => (
                <tr key={f.day}>
                  <td className="px-4 py-2">{f.day}</td>
                  <td className="px-4 py-2 text-right text-emerald-600">{f.in ? money(f.in) : "—"}</td>
                  <td className="px-4 py-2 text-right text-red-600">{f.out ? money(f.out) : "—"}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${f.balance < 0 ? "text-red-600" : ""}`}>{money(f.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aba === "categorias" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {[["INCOME", "Receitas", income, "bg-emerald-500"], ["EXPENSE", "Despesas", expense, "bg-red-500"]].map(([type, label, total, bar]) => (
            <div key={type as string} className="card p-4">
              <h3 className="mb-3 font-semibold">{label as string}</h3>
              {byCat(type as string).length === 0 && <p className="text-sm text-slate-500">Sem lançamentos.</p>}
              <div className="space-y-3">
                {byCat(type as string).map(([cat, v]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm"><span>{cat}</span><span className="font-semibold">{money(v)}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${bar}`} style={{ width: `${Math.max(2, (v / ((total as number) || 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === "receber" && (
        <div className="card divide-y divide-slate-100">
          {open.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Nenhuma parcela em aberto. 🎉</p>}
          {open.map((i) => {
            const late = isOverdue(i.dueDate, now);
            return (
              <Link key={i.id} href={`/app/pedidos/${i.orderId}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{i.order.client?.name ?? "Sem cliente"} · pedido nº {i.order.code}</div>
                  <div className={`text-xs ${late ? "font-semibold text-red-600" : "text-slate-500"}`}>Parcela {i.number} · vence {date(i.dueDate)}{late && " · atrasada"}</div>
                </div>
                <div className="font-semibold">{money(i.amount - i.paidAmount)}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
