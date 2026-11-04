import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { TransactionForm } from "@/components/TransactionForm";
import { PageHeader } from "@/components/ui";
import { saveTransaction } from "@/actions/records";

export const metadata = { title: "Editar lançamento" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession();
  const { id } = await params;
  const tx = await db.transaction.findFirst({ where: { id, companyId, paymentId: null } });
  if (!tx) notFound();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Editar lançamento" back="/app/financeiro" />
      <TransactionForm tx={tx} defaultType={tx.type} action={saveTransaction.bind(null, id)} />
    </div>
  );
}
