import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { num } from "@/lib/format";
import { CatalogForm } from "@/components/CatalogForm";
import { PageHeader } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { adjustStock, deleteCatalogItem, saveCatalogItem } from "@/actions/records";

export const metadata = { title: "Editar item" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession();
  const { id } = await params;
  const item = await db.catalogItem.findFirst({ where: { id, companyId } });
  if (!item) notFound();
  const sold = await db.orderItem.aggregate({ where: { catalogItemId: id, order: { status: { not: "CANCELED" } } }, _sum: { quantity: true } });

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title={item.name} back="/app/catalogo" subtitle={`${num(sold._sum.quantity ?? 0)} ${item.unit} vendidos em pedidos`} />
      {item.trackStock && (
        <form action={adjustStock.bind(null, id)} className="card flex flex-wrap items-end gap-2 p-4">
          <div className="mr-auto">
            <div className="text-xs font-semibold uppercase text-slate-500">Estoque atual</div>
            <div className="text-2xl font-bold">{num(item.stock)} {item.unit}</div>
          </div>
          <label>
            <span className="label">Entrada (+) / saída (−)</span>
            <input name="delta" type="number" step="any" className="input w-36" placeholder="Ex.: 10 ou -2" />
          </label>
          <SubmitButton className="btn-secondary">Ajustar</SubmitButton>
        </form>
      )}
      <CatalogForm item={item} defaultType={item.type} action={saveCatalogItem.bind(null, id)} />
      <form action={deleteCatalogItem.bind(null, id)}>
        <ConfirmSubmit message="Excluir este item do catálogo?">Excluir item</ConfirmSubmit>
      </form>
    </div>
  );
}
