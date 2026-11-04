import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { trackQuoteView } from "@/lib/tracking";
import { dateTime, money } from "@/lib/format";
import { calcTotals } from "@/lib/calc";
import { DocumentView } from "@/components/DocumentView";
import { PortalChrome } from "@/components/PortalChrome";
import { ApprovalPanel } from "@/components/ApprovalPanel";
import { PixBox } from "@/components/PixBox";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

async function load(token: string) {
  return db.quote.findUnique({
    where: { token },
    include: { company: true, client: true, items: { orderBy: { position: "asc" } }, photos: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const q = await load((await params).token);
  return { title: q ? `Orçamento nº ${q.code} — ${q.company.name}` : "Orçamento", robots: { index: false } };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const q = await load(token);
  if (!q) notFound();
  await trackQuoteView(q, q.client?.name);

  const total = calcTotals(q.items, q.discountType, q.discountValue, q.deliveryFee).total;
  const approved = ["APPROVED", "CONVERTED"].includes(q.status);
  const expired = !approved && q.validUntil && q.validUntil.getTime() + 86400000 < Date.now();

  return (
    <PortalChrome company={q.company} whatsText={`Olá! Tenho uma dúvida sobre o orçamento nº ${q.code}.`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <aside className="space-y-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <div className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Orçamento nº {q.code}</div>
            <div className="text-3xl font-bold">{money(total)}</div>
            {q.client && <div className="text-sm text-slate-500">Para {q.client.name}</div>}
            <a href={`/o/${token}/pdf`} target="_blank" className="btn-secondary mt-3 w-full no-print">
              <Icon name="download" className="h-4 w-4" /> Baixar PDF
            </a>
          </div>

          {approved ? (
            <div className="card flex items-start gap-3 border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <Icon name="check" className="mt-0.5 h-6 w-6 flex-none" />
              <div>
                <div className="font-semibold">Orçamento aprovado</div>
                <div className="text-sm">Confirmado em {dateTime(q.approvedAt)}{q.approvedByName && ` por ${q.approvedByName}`}</div>
              </div>
            </div>
          ) : q.status === "REJECTED" ? (
            <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">Este orçamento foi recusado.</div>
          ) : expired ? (
            <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Este orçamento está vencido. Fale com a empresa para atualizá-lo.</div>
          ) : (
            <div className="no-print">
              <ApprovalPanel token={token} defaultName={q.client?.name} />
            </div>
          )}

          <PixBox company={q.company} amount={total} txid={`ORC${q.code}`} />
        </aside>

        <div className="lg:order-1">
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
      </div>
    </PortalChrome>
  );
}
