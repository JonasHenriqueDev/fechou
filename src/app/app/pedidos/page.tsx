import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ORDER_KIND, ORDER_STATUS } from "@/lib/constants";
import { date, money } from "@/lib/format";
import { Badge, Chip, Empty, PageHeader, SearchBox } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Pedidos e OS" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; tipo?: string }> }) {
  const { companyId } = await requireSession();
  const { q, status, tipo } = await searchParams;
  const orders = await db.order.findMany({
    where: {
      companyId,
      ...(status ? { status } : {}),
      ...(tipo ? { kind: tipo } : {}),
      ...(q ? { OR: [{ code: { contains: q } }, { title: { contains: q } }, { client: { name: { contains: q } } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { client: true, payments: { select: { amount: true } } },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Pedidos e ordens de serviço"
        subtitle={`${orders.length} encontrado(s)`}
        actions={
          <Link href="/app/pedidos/novo" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" /> Novo pedido / OS
          </Link>
        }
      />
      <SearchBox placeholder="Buscar por cliente, número ou título" defaultValue={q} />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip href="/app/pedidos" active={!status && !tipo}>Todos</Chip>
        <Chip href="/app/pedidos?tipo=ORDER" active={tipo === "ORDER"}>Pedidos</Chip>
        <Chip href="/app/pedidos?tipo=SERVICE_ORDER" active={tipo === "SERVICE_ORDER"}>Ordens de serviço</Chip>
        {Object.entries(ORDER_STATUS).map(([k, s]) => (
          <Chip key={k} href={`/app/pedidos?status=${k}`} active={status === k}>{s.label}</Chip>
        ))}
      </div>
      {orders.length === 0 ? (
        <Empty icon="cart" title="Nenhum pedido" text="Crie um pedido ou gere a partir de um orçamento aprovado." action={<Link href="/app/pedidos/novo" className="btn-primary">Novo pedido</Link>} />
      ) : (
        <div className="card divide-y divide-slate-100">
          {orders.map((o) => {
            const paid = o.payments.reduce((s, p) => s + p.amount, 0);
            return (
              <Link key={o.id} href={`/app/pedidos/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="truncate font-medium">{o.client?.name ?? "Sem cliente"}</div>
                  <div className="truncate text-xs text-slate-500">
                    {ORDER_KIND[o.kind]} nº {o.code} · {date(o.createdAt)}
                    {o.title && ` · ${o.title}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold">{money(o.total)}</span>
                  <div className="flex gap-1">
                    {paid >= o.total - 0.005 && o.total > 0 ? (
                      <span className="badge bg-emerald-100 text-emerald-700">Pago</span>
                    ) : paid > 0 ? (
                      <span className="badge bg-amber-100 text-amber-800">Parcial</span>
                    ) : null}
                    <Badge map={ORDER_STATUS} value={o.status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
