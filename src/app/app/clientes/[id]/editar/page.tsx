import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClientForm } from "@/components/ClientForm";
import { PageHeader } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client";
import { deleteClient, saveClient } from "@/actions/records";

export const metadata = { title: "Editar cliente" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession();
  const { id } = await params;
  const client = await db.client.findFirst({ where: { id, companyId } });
  if (!client) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Editar cliente" back={`/app/clientes/${id}`} />
      <ClientForm client={client} action={saveClient.bind(null, id)} />
      <form action={deleteClient.bind(null, id)}>
        <ConfirmSubmit message="Excluir este cliente? Orçamentos e pedidos serão mantidos, sem vínculo.">Excluir cliente</ConfirmSubmit>
      </form>
    </div>
  );
}
