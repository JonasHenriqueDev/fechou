import { requireSession } from "@/lib/auth";
import { TransactionForm } from "@/components/TransactionForm";
import { PageHeader } from "@/components/ui";
import { saveTransaction } from "@/actions/records";

export const metadata = { title: "Novo lançamento" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await requireSession();
  const { tipo } = await searchParams;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Novo lançamento" back="/app/financeiro" />
      <TransactionForm defaultType={tipo === "EXPENSE" ? "EXPENSE" : "INCOME"} action={saveTransaction.bind(null, null)} />
    </div>
  );
}
