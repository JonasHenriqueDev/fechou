import { requireCompany } from "@/lib/auth";
import { editorOptions, emptyEditor } from "@/lib/editor";
import { DocumentEditor } from "@/components/DocumentEditor";
import { PageHeader } from "@/components/ui";
import { saveOrder } from "@/actions/orders";

export const metadata = { title: "Novo pedido" };

export default async function Page({ searchParams }: { searchParams: Promise<{ cliente?: string; tipo?: string }> }) {
  const { company } = await requireCompany();
  const { cliente, tipo } = await searchParams;
  const opts = await editorOptions(company.id);
  const initial = { ...emptyEditor(company, cliente ?? ""), kind: tipo === "SERVICE_ORDER" ? "SERVICE_ORDER" : "ORDER", notes: "" };
  return (
    <div>
      <PageHeader title="Novo pedido / ordem de serviço" back="/app/pedidos" />
      <DocumentEditor mode="order" initial={initial} {...opts} action={saveOrder.bind(null, null)} submitLabel="Salvar pedido" />
    </div>
  );
}
