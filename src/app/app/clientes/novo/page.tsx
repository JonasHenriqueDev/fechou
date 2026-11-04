import { requireSession } from "@/lib/auth";
import { ClientForm } from "@/components/ClientForm";
import { PageHeader } from "@/components/ui";
import { saveClient } from "@/actions/records";

export const metadata = { title: "Novo cliente" };

export default async function Page() {
  await requireSession();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Novo cliente" back="/app/clientes" />
      <ClientForm action={saveClient.bind(null, null)} />
    </div>
  );
}
