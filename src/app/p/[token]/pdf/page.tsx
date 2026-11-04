import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ORDER_KIND } from "@/lib/constants";
import { date, money } from "@/lib/format";
import { DocumentView } from "@/components/DocumentView";
import { AutoPrint, PrintButton } from "@/components/client";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const o = await db.order.findUnique({
    where: { token },
    include: { company: true, client: true, items: { orderBy: { position: "asc" } }, installments: { orderBy: { number: "asc" } } },
  });
  if (!o) notFound();
  const label = ORDER_KIND[o.kind];
  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-6">
      <title>{`${label}-${o.code}-${o.company.name}`}</title>
      <div className="no-print mb-3 flex items-center justify-between gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
        <span>Na janela de impressão, escolha <b>“Salvar como PDF”</b>.</span>
        <PrintButton className="btn-primary btn-sm" />
      </div>
      <AutoPrint />
      <DocumentView
        company={o.company}
        client={o.client}
        docLabel={label}
        code={o.code}
        issueDate={o.createdAt}
        title={o.title}
        items={o.items}
        discountType={o.discountType}
        discountValue={o.discountValue}
        deliveryFee={o.deliveryFee}
        sections={[
          { title: "Data de entrega / execução", text: o.scheduledDate ? date(o.scheduledDate) : null },
          { title: "Parcelas", text: o.installments.map((i) => `${i.number}ª — ${money(i.amount)} — vence ${date(i.dueDate)}${i.paidAt ? " (paga)" : ""}`).join("\n") || null },
          { title: "Observações", text: o.notes },
        ]}
      />
    </div>
  );
}
