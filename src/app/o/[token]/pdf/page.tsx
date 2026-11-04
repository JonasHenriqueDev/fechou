import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DocumentView } from "@/components/DocumentView";
import { AutoPrint, PrintButton } from "@/components/client";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const q = await db.quote.findUnique({
    where: { token },
    include: { company: true, client: true, items: { orderBy: { position: "asc" } }, photos: true },
  });
  if (!q) notFound();
  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-6">
      <title>{`Orcamento-${q.code}-${q.company.name}`}</title>
      <div className="no-print mb-3 flex items-center justify-between gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
        <span>Na janela de impressão, escolha <b>“Salvar como PDF”</b>.</span>
        <PrintButton className="btn-primary btn-sm" />
      </div>
      <AutoPrint />
      <DocumentView
        company={q.company}
        client={q.client}
        docLabel="Orçamento"
        code={q.code}
        issueDate={q.issueDate}
        validUntil={q.validUntil}
        title={q.title}
        items={q.items}
        discountType={q.discountType}
        discountValue={q.discountValue}
        deliveryFee={q.deliveryFee}
        photos={q.photos}
        sections={[
          { title: "Prazo de execução", text: q.executionTerm },
          { title: "Formas de pagamento", text: q.paymentConditions },
          { title: "Garantia", text: q.warranty },
          { title: "Observações", text: q.notes },
        ]}
        clientSignature={q.clientSignature}
        signedAt={q.approvedAt}
        signedBy={q.approvedByName}
      />
    </div>
  );
}
