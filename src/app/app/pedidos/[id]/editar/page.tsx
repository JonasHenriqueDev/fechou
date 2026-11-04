import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { editorOptions, orderToEditor } from "@/lib/editor";
import { DocumentEditor } from "@/components/DocumentEditor";
import { PageHeader } from "@/components/ui";
import { saveOrder } from "@/actions/orders";

export const metadata = { title: "Editar pedido" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession();
  const { id } = await params;
  const o = await db.order.findFirst({ where: { id, companyId }, include: { items: true } });
  if (!o) notFound();
  const opts = await editorOptions(companyId);
  return (
    <div>
      <PageHeader title={`Editar pedido nº ${o.code}`} back={`/app/pedidos/${id}`} />
      <DocumentEditor mode="order" initial={orderToEditor(o)} {...opts} action={saveOrder.bind(null, id)} submitLabel="Salvar alterações" />
    </div>
  );
}
