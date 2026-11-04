import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, num } from "@/lib/format";
import { Chip, Empty, PageHeader, SearchBox } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Catálogo e estoque" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; tipo?: string; estoque?: string }> }) {
  const { companyId } = await requireSession();
  const { q, tipo, estoque } = await searchParams;
  const items = await db.catalogItem.findMany({
    where: {
      companyId,
      ...(tipo ? { type: tipo } : {}),
      ...(estoque ? { trackStock: true, stock: { lte: 5 } } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  const stockValue = items.filter((i) => i.trackStock && i.stock > 0).reduce((s, i) => s + i.stock * i.cost, 0);

  return (
    <div>
      <PageHeader
        title="Catálogo e estoque"
        subtitle={`${items.length} item(ns) · estoque a custo ${money(stockValue)}`}
        actions={
          <Link href={`/app/catalogo/novo${tipo ? `?tipo=${tipo}` : ""}`} className="btn-primary">
            <Icon name="plus" className="h-4 w-4" /> Novo item
          </Link>
        }
      />
      <SearchBox placeholder="Buscar produto ou serviço" defaultValue={q} />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip href="/app/catalogo" active={!tipo && !estoque}>Todos</Chip>
        <Chip href="/app/catalogo?tipo=SERVICE" active={tipo === "SERVICE"}>Serviços</Chip>
        <Chip href="/app/catalogo?tipo=PRODUCT" active={tipo === "PRODUCT"}>Produtos</Chip>
        <Chip href="/app/catalogo?estoque=baixo" active={!!estoque}>Estoque baixo</Chip>
      </div>
      {items.length === 0 ? (
        <Empty icon="box" title="Catálogo vazio" text="Cadastre produtos e serviços com foto e preço para montar orçamentos em segundos." action={<Link href="/app/catalogo/novo" className="btn-primary">Cadastrar item</Link>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <Link key={i.id} href={`/app/catalogo/${i.id}`} className={`card flex gap-3 p-3 hover:border-brand-300 ${i.active ? "" : "opacity-50"}`}>
              {i.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.photo} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
              ) : (
                <div className="grid h-16 w-16 flex-none place-items-center rounded-lg bg-slate-100 text-slate-400"><Icon name="box" /></div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{i.name}</div>
                <div className="text-xs text-slate-500">{i.type === "SERVICE" ? "Serviço" : "Produto"} · {i.unit}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-semibold text-brand-700">{money(i.price)}</span>
                  {i.trackStock && (
                    <span className={`badge whitespace-nowrap ${i.stock <= 0 ? "bg-red-100 text-red-700" : i.stock <= 5 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                      {num(i.stock)} em estoque
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
