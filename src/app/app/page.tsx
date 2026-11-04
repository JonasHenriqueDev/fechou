import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { QUOTE_STATUS } from "@/lib/constants";
import { date, money, time, isOverdue } from "@/lib/format";
import { Badge, PageHeader, Stat } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ bemvindo?: string }> }) {
  const { company } = await requireCompany();
  const { bemvindo } = await searchParams;
  const cid = company.id;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const in7 = new Date(now.getTime() + 7 * 86400000);

  const [quotesMonth, approvedMonth, received, installments, upcoming, recent, clients, catalog] = await Promise.all([
    db.quote.count({ where: { companyId: cid, createdAt: { gte: monthStart } } }),
    db.quote.count({ where: { companyId: cid, approvedAt: { gte: monthStart } } }),
    db.transaction.aggregate({ where: { companyId: cid, type: "INCOME", date: { gte: monthStart } }, _sum: { amount: true } }),
    db.installment.findMany({ where: { order: { companyId: cid, status: { not: "CANCELED" } }, paidAt: null } }),
    db.appointment.findMany({ where: { companyId: cid, done: false, start: { gte: new Date(now.getTime() - 3600_000), lte: in7 } }, orderBy: { start: "asc" }, take: 5, include: { client: true } }),
    db.quote.findMany({ where: { companyId: cid }, orderBy: { createdAt: "desc" }, take: 6, include: { client: true } }),
    db.client.count({ where: { companyId: cid } }),
    db.catalogItem.count({ where: { companyId: cid } }),
  ]);

  const receivable = installments.reduce((s, i) => s + i.amount - i.paidAmount, 0);
  const overdue = installments.filter((i) => isOverdue(i.dueDate, now)).reduce((s, i) => s + i.amount - i.paidAmount, 0);

  const steps = [
    { done: !!company.logo, label: "Adicione sua logo", href: "/app/configuracoes" },
    { done: !!company.pixKey, label: "Cadastre sua chave Pix", href: "/app/configuracoes#pix" },
    { done: catalog > 0, label: "Cadastre um produto ou serviço", href: "/app/catalogo/novo" },
    { done: clients > 0, label: "Cadastre um cliente", href: "/app/clientes/novo" },
    { done: recent.length > 0, label: "Crie seu primeiro orçamento", href: "/app/orcamentos/novo" },
  ];
  const pending = steps.filter((s) => !s.done);

  return (
    <div>
      <PageHeader
        title={bemvindo ? `Bem-vindo(a)! 🎉` : `Olá, ${company.name}`}
        subtitle="Resumo do seu negócio neste mês"
        actions={
          <>
            <Link href="/app/orcamentos/novo" className="btn-primary hidden sm:inline-flex">
              <Icon name="plus" className="h-4 w-4" /> Novo orçamento
            </Link>
            <Link href="/app/pedidos/novo" className="btn-secondary hidden sm:inline-flex">Novo pedido</Link>
          </>
        }
      />

      {pending.length > 0 && (
        <div className="card mb-5 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <Icon name="sparkles" className="h-5 w-5 text-brand-600" /> Primeiros passos ({steps.length - pending.length}/{steps.length})
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <Link key={s.label} href={s.href} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${s.done ? "border-emerald-200 bg-emerald-50 text-emerald-700 line-through" : "border-slate-200 hover:bg-slate-50"}`}>
                <Icon name={s.done ? "check" : "plus"} className="h-4 w-4" /> {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orçamentos no mês" value={String(quotesMonth)} hint={`${approvedMonth} aprovados`} tone="blue" />
        <Stat label="Recebido no mês" value={money(received._sum.amount)} tone="green" />
        <Stat label="A receber" value={money(receivable)} tone="amber" />
        <Stat label="Em atraso" value={money(overdue)} tone="red" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold">Últimos orçamentos</h2>
            <Link href="/app/orcamentos" className="text-sm font-semibold text-brand-600">Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Nenhum orçamento ainda.</p>
          ) : (
            <div className="stagger divide-y divide-slate-100">
              {recent.map((q) => (
                <Link key={q.id} href={`/app/orcamentos/${q.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{q.client?.name ?? "Sem cliente"} · nº {q.code}</div>
                    <div className="text-xs text-slate-500">{date(q.createdAt)}{q.viewCount > 0 && ` · visto ${q.viewCount}×`}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">{money(q.total)}</span>
                    <Badge map={QUOTE_STATUS} value={q.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold">Próximos compromissos</h2>
            <Link href="/app/agenda" className="text-sm font-semibold text-brand-600">Agenda</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Nada agendado para os próximos 7 dias.</p>
          ) : (
            <div className="stagger divide-y divide-slate-100">
              {upcoming.map((a) => (
                <Link key={a.id} href={`/app/agenda/${a.id}`} className="flex gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="w-14 flex-none text-center">
                    <div className="text-xs text-slate-500">{date(a.start).slice(0, 5)}</div>
                    <div className="text-sm font-bold text-brand-600">{time(a.start)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{a.title}</div>
                    <div className="truncate text-xs text-slate-500">{[a.client?.name, a.location].filter(Boolean).join(" · ")}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
