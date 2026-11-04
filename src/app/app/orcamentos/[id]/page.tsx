import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { QUOTE_STATUS } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui";
import { DocumentView } from "@/components/DocumentView";
import { ConfirmSubmit, CopyButton, ShareButton, TextShare, WhatsAppShare } from "@/components/client";
import { pixCode } from "@/components/PixBox";
import { documentText } from "@/lib/whatsappText";
import { Icon } from "@/components/Icon";
import { convertQuoteToOrder, deleteQuote, duplicateQuote, markQuoteSent, setQuoteStatus } from "@/actions/quotes";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { company } = await requireCompany();
  const { id } = await params;
  const q = await db.quote.findFirst({
    where: { id, companyId: company.id },
    include: { client: true, items: { orderBy: { position: "asc" } }, photos: true, orders: true },
  });
  if (!q) notFound();

  const portal = `/o/${q.token}`;
  const msg = `Olá${q.client ? `, ${q.client.name.split(" ")[0]}` : ""}! Segue o orçamento nº ${q.code} de ${company.name} no valor de ${money(q.total)}. Você pode visualizar, aprovar e assinar pelo link:`;
  const canApprove = !["APPROVED", "CONVERTED"].includes(q.status);
  const text = documentText({
    docLabel: "Orçamento",
    code: q.code,
    companyName: company.name,
    clientName: q.client?.name,
    title: q.title,
    issueDate: q.issueDate,
    validUntil: q.validUntil,
    items: q.items,
    discountType: q.discountType,
    discountValue: q.discountValue,
    deliveryFee: q.deliveryFee,
    sections: [
      { title: "Prazo de execução", text: q.executionTerm },
      { title: "Formas de pagamento", text: q.paymentConditions },
      { title: "Garantia", text: q.warranty },
      { title: "Observações", text: q.notes },
    ],
    closing: "Para aprovar e assinar online:",
  });
  const pix = pixCode(company, q.total, `ORC${q.code}`);

  return (
    <div>
      <PageHeader
        title={`Orçamento nº ${q.code}`}
        back="/app/orcamentos"
        subtitle={<Badge map={QUOTE_STATUS} value={q.status} />}
        actions={
          <Link href={`/app/orcamentos/${q.id}/editar`} className="btn-secondary">
            <Icon name="edit" className="h-4 w-4" /> Editar
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="order-2 lg:order-1">
          <DocumentView
            company={company}
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

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <div className="card space-y-2 p-4">
            <h2 className="font-semibold">Enviar ao cliente</h2>
            <WhatsAppShare phone={q.client?.phone} message={msg} path={portal} className="btn-whatsapp w-full" onSent={markQuoteSent.bind(null, q.id)} />
            <div className="grid grid-cols-2 gap-2">
              <a href={portal} target="_blank" className="btn-secondary">
                <Icon name="eye" className="h-4 w-4" /> Portal
              </a>
              <a href={`${portal}/pdf`} target="_blank" className="btn-secondary">
                <Icon name="download" className="h-4 w-4" /> PDF
              </a>
            </div>
            <ShareButton url={portal} title={`Orçamento ${q.code}`} />
            <div className="border-t border-slate-100 pt-3">
              <div className="mb-1 text-sm font-semibold">Orçamento em texto</div>
              <p className="mb-2 text-xs text-slate-500">Para cliente que não abre PDF: itens, valores e condições direto na conversa.</p>
              <TextShare phone={q.client?.phone} text={text} path={portal} onSent={markQuoteSent.bind(null, q.id)} />
              {pix && (
                <>
                  <CopyButton text={pix} label="Copiar Pix copia e cola" className="btn-secondary mt-2 w-full" />
                  <p className="mt-1 text-xs text-slate-500">Mande o código numa mensagem separada, para o cliente copiar e pagar.</p>
                </>
              )}
            </div>
          </div>

          <div className="card space-y-2 p-4 text-sm">
            <h2 className="font-semibold">Acompanhamento</h2>
            <Info label="Criado em" value={dateTime(q.createdAt)} />
            <Info label="Visualizações do cliente" value={q.viewCount > 0 ? `${q.viewCount}× · última em ${dateTime(q.viewedAt)}` : "Ainda não abriu"} />
            {q.approvedAt && <Info label="Aprovado" value={`${dateTime(q.approvedAt)} por ${q.approvedByName ?? "—"}`} />}
            {q.rejectedAt && <Info label="Recusado" value={`${dateTime(q.rejectedAt)}${q.rejectReason ? ` — “${q.rejectReason}”` : ""}`} />}
            {q.orders.map((o) => (
              <Link key={o.id} href={`/app/pedidos/${o.id}`} className="block font-semibold text-brand-600">→ Pedido nº {o.code}</Link>
            ))}
          </div>

          <div className="card space-y-2 p-4">
            <h2 className="font-semibold">Ações</h2>
            <form action={convertQuoteToOrder.bind(null, q.id, "ORDER")}>
              <button className="btn-primary w-full">Gerar pedido de venda</button>
            </form>
            <form action={convertQuoteToOrder.bind(null, q.id, "SERVICE_ORDER")}>
              <button className="btn-secondary w-full">Gerar ordem de serviço</button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {canApprove && (
                <form action={setQuoteStatus.bind(null, q.id, "APPROVED")}>
                  <button className="btn-success w-full">Aprovar</button>
                </form>
              )}
              {q.status !== "REJECTED" && canApprove && (
                <form action={setQuoteStatus.bind(null, q.id, "REJECTED")}>
                  <button className="btn-danger w-full">Recusar</button>
                </form>
              )}
              {!canApprove && (
                <form action={setQuoteStatus.bind(null, q.id, "SENT")} className="col-span-2">
                  <button className="btn-secondary w-full">Reabrir orçamento</button>
                </form>
              )}
            </div>
            <form action={duplicateQuote.bind(null, q.id)}>
              <button className="btn-secondary w-full">
                <Icon name="copy" className="h-4 w-4" /> Duplicar
              </button>
            </form>
            <form action={deleteQuote.bind(null, q.id)}>
              <ConfirmSubmit message="Excluir este orçamento?" className="btn-danger w-full">
                <Icon name="trash" className="h-4 w-4" /> Excluir
              </ConfirmSubmit>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
